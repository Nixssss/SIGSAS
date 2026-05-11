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
                bnb_4bit_compute_dtype=torch.float16,
            )
            print("[SIGSAS DEBUG] 2. Configuração de memória (4-bit) definida.", flush=True)
            
            # Carregamento do modelo Phi-3 com travas para evitar estouro de memória
            print("[SIGSAS DEBUG] 3. Sincronizando motor de IA local... (Aguarde 1-2 min)", flush=True)
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
            print("[SIGSAS DEBUG] 4. Motor de IA carregado e pronto!\n", flush=True)

        except Exception as e:
            print(f"\n[ERRO CRÍTICO NA IA] Falha ao iniciar: {str(e)}", flush=True)
            self.model = None

    def processar_agendamento(self, mensagem: str):
        """
        Interpreta a mensagem do professor e extrai dados para o SIGSAS.
        Focado nos requisitos de capacidade e tipo de sala definidos no TCC.
        """
        if not self.model:
            return {"status": "erro", "detalhes": "Motor de IA não inicializado."}
        
        # PROMPT DE ENGENHARIA (Instruções rigorosas para a IA)
        prompt = f"""<|system|>
Você é a IA do SIGSAS. Extraia dados de agendamento do professor.
Retorne APENAS um JSON puro (sem explicações) no formato:
{{
  "intencao": "reservar" | "cancelar" | "consultar",
  "sala_tipo": "laboratorio" | "sala_aula" | "auditorio",
  "capacidade_estimada": int,
  "data": "YYYY-MM-DD",
  "horario": "HH:MM"
}}
Se não souber o valor de um campo, coloque null.<|end|>
<|user|>
Mensagem: "{mensagem}"<|end|>
<|assistant|>
"""
        # GERAÇÃO DA RESPOSTA (Configurada para precisão máxima)
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        outputs = self.model.generate(
            **inputs, 
            max_new_tokens=150, 
            temperature=0.1, 
            do_sample=False
        )
        resposta_bruta = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        
        try:
            # Localiza o conteúdo entre chaves { } caso a IA adicione texto extra
            json_match = re.search(r'\{.*\}', resposta_bruta, re.DOTALL)
            if json_match:
                dados_json = json.loads(json_match.group())
            else:
                dados_json = {"erro": "JSON não detectado", "texto_bruto": resposta_bruta}
        except Exception as e:
            dados_json = {"erro": f"Falha no processamento: {str(e)}", "raw": resposta_bruta}

        return {
            "status": "sucesso",
            "dados_extraidos": dados_json,
            "mensagem_usuario": "Interpretei seu pedido. Verificando as regras de negócio do SIGSAS..."
        }