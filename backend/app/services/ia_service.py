from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import torch
import os
import re
import json

class LocalAIProcessor:

    def __init__(self):
        print("\n[SIGSAS DEBUG] 1. Iniciando carregamento do serviço de IA...", flush=True)

        try:
            if not os.path.exists("offload"):
                os.makedirs("offload")

            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16
            )

            print("[SIGSAS DEBUG] 2. Configuração de 4-bit aplicada.", flush=True)

            model_id = "microsoft/Phi-3-mini-4k-instruct"

            print("[SIGSAS DEBUG] 3. Carregando modelo (pode levar 1-2 min)...", flush=True)

            self.model = AutoModelForCausalLM.from_pretrained(
                model_id,
                device_map="auto",
                quantization_config=bnb_config,
                attn_implementation="eager",
                low_cpu_mem_usage=True,
                offload_folder="offload",
                trust_remote_code=False
            )

            self.tokenizer = AutoTokenizer.from_pretrained(model_id)

            print("[SIGSAS DEBUG] 4. IA carregada com sucesso!\n", flush=True)

        except Exception as e:
            print(f"[ERRO CRÍTICO] Falha ao carregar IA: {str(e)}", flush=True)
            self.model = None
    # PROCESSADOR
    def processar_agendamento(self, mensagem: str, db=None):

        if not self.model:
            return {
                "erro": "Motor de IA não inicializado."
            }

        prompt = f"""
<|system|>
Você é a IA do SIGSAS. Extraia dados de agendamento.
Retorne APENAS JSON puro no formato:

{{
  "intencao": "reservar" | "cancelar" | "consultar",
  "sala_tipo": "laboratorio" | "sala_aula" | "auditorio",
  "capacidade_estimada": int,
  "data": "YYYY-MM-DD",
  "horario": "HH:MM"
}}

Se não souber algo, retorne null.
<|end|>

<|user|> Mensagem: "{mensagem}" <|end|>
<|assistant|>
"""

        inputs = self.tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(self.model.device, dtype=torch.long) for k, v in inputs.items()}

        outputs = self.model.generate(
            **inputs,
            max_new_tokens=150,
            temperature=0.1,
            do_sample=False
        )

        resposta_bruta = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Limpeza do JSON
        try:
            match = re.findall(r"\{[^{}]*\}", resposta_bruta)

            if not match:
                dados_json = {"erro": "JSON não encontrado", "bruto": resposta_bruta}
            else:
                dados_json = json.loads(match[-1])  
        except Exception as e:
            dados_json = {
                "erro": f"Falha ao decodificar JSON: {str(e)}",
                "raw": resposta_bruta
            }

        # retorno compatível com o Chat Inteligente
        return {
            "dados_extraidos": dados_json,
            "mensagem_amigavel": "Interpretei seu pedido. Validando regras de negócio...",
        }