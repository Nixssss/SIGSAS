from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import torch
import os
import re
import json

class LocalAIProcessor:
    def __init__(self):
        print("\n[SIGSAS DEBUG] IA inicializada (sem carregar modelo ainda)\n", flush=True)

        self.model = None
        self.tokenizer = None

    def load_model(self):
        if self.model is not None:
            return

        print("\n[SIGSAS DEBUG] 1. Carregando modelo de IA (primeira vez pode demorar)...", flush=True)

        if not os.path.exists("offload"):
            os.makedirs("offload")

        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
        )

        model_id = "microsoft/Phi-3-mini-4k-instruct"

        self.model = AutoModelForCausalLM.from_pretrained(
            model_id,
            device_map="auto",
            quantization_config=bnb_config,
            trust_remote_code=False,
            attn_implementation="eager",
            low_cpu_mem_usage=True,
            offload_folder="offload"
        )

        self.tokenizer = AutoTokenizer.from_pretrained(model_id)

        print("\n[SIGSAS DEBUG] 2. IA carregada com sucesso!\n", flush=True)

    def processar_agendamento(self, mensagem: str):

        # 🔥 garante que o modelo só carrega quando precisar
        if self.model is None:
            self.load_model()

        prompt = f"""<|system|>
Você é a IA do SIGSAS. Extraia dados de agendamento.
Retorne APENAS JSON:
{{
  "intencao": "reservar" | "cancelar" | "consultar",
  "sala_tipo": "laboratorio" | "sala_aula" | "auditorio",
  "capacidade_estimada": int,
  "data": "YYYY-MM-DD",
  "horario": "HH:MM"
}}
Se não souber, use null.<|end|>
<|user|>
Mensagem: "{mensagem}"<|end|>
<|assistant|>
"""

        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        outputs = self.model.generate(
            **inputs,
            max_new_tokens=150,
            temperature=0.1,
            do_sample=False
        )

        resposta_bruta = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        try:
            json_match = re.search(r'\{.*\}', resposta_bruta, re.DOTALL)

            if json_match:
                dados_json = json.loads(json_match.group())
            else:
                dados_json = {
                    "erro": "JSON não detectado",
                    "texto_bruto": resposta_bruta
                }

        except Exception as e:
            dados_json = {
                "erro": f"Falha no processamento: {str(e)}",
                "raw": resposta_bruta
            }

        return {
            "status": "sucesso",
            "dados_extraidos": dados_json,
            "mensagem_usuario": "Interpretei seu pedido com IA local."
        }