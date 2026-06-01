import torch
import os
import re
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

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
                llm_int8_enable_fp32_cpu_offload=True
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
Você é a IA de agendamentos oficial do SIGSAS. Sua função é transformar mensagens em
dados estruturados de agendamento. Siga as regras com rigor absoluto:

REGRAS GERAIS (NUNCA viole):
1. Responda SOMENTE um JSON válido, puro, sem explicações, sem frases, sem markdown.
2. Se não souber um valor, retorne null.
3. Nunca invente datas, salas ou capacidades.
4. Nunca crie texto fora do JSON.
5. Nunca mude nomes de campos.
6. Nunca inclua comentários.
7. Nunca retorne duas estruturas JSON — apenas uma.

ESTRUTURA OBRIGATÓRIA DO JSON:
{{
 "intencao": "reservar" | "cancelar" | "consultar" | null,
 "sala_tipo": "laboratorio" | "sala_aula" | "auditorio" | null,
 "capacidade_estimada": int | null,
 "data": "YYYY-MM-DD" | null,
 "horario": "HH:MM" | null
}}

NORMALIZAÇÕES:
- Converta “sala de aula” → "sala_aula"
- Converta "auditório" → "auditorio"
- Se a mensagem tiver números, interprete como capacidade, exceto se for data/hora.
- Datas como "amanhã", "depois de amanhã", "quinta" devem virar null (backend resolverá).
- Horários como “10h”, “14 horas”, “às 9” → HH:MM com zero à esquerda.
- Nunca tente converter datas relativas para datas absolutas.
- Não tente interpretar campus — isso é responsabilidade do backend.


EXEMPLOS (SIGA O PADRÃO EXATO):

EXEMPLO 1:
Entrada:
"Quero reservar um laboratório amanhã às 10h para 20 alunos"
Saída:
{{
 "intencao": "reservar",
 "sala_tipo": "laboratorio",
 "capacidade_estimada": 20,
 "data": null,
 "horario": "10:00"
}}

EXEMPLO 2:
Entrada:
"Preciso de um auditório quinta à tarde"
Saída:
{{
 "intencao": "reservar",
 "sala_tipo": "auditorio",
 "capacidade_estimada": null,
 "data": null,
 "horario": null
}}

EXEMPLO 3:
Entrada:
"Agendar sala de aula dia 2025-03-19 às 14"
Saída:
{{
 "intencao": "reservar",
 "sala_tipo": "sala_aula",
 "capacidade_estimada": null,
 "data": "2025-03-19",
 "horario": "14:00"
}}

EXEMPLO 4:
Entrada:
"Quero cancelar a reserva de laboratório das 8h"
Saída:
{{
 "intencao": "cancelar",
 "sala_tipo": "laboratorio",
 "capacidade_estimada": null,
 "data": null,
 "horario": "08:00"
}}

EXEMPLO 5:
Entrada:
"Tem sala disponível para 40 pessoas?"
Saída:
{{
 "intencao": "consultar",
 "sala_tipo": null,
 "capacidade_estimada": 40,
 "data": null,
 "horario": null
}}

EXEMPLO 6:
Entrada:
"Quero reservar um laboratório grande, umas 35 pessoas"
Saída:
{{
 "intencao": "reservar",
 "sala_tipo": "laboratorio",
 "capacidade_estimada": 35,
 "data": null,
 "horario": null
}}

EXEMPLO 7:
Entrada:
"Reservar sala de aula 2025-12-01 09:30"
Saída:
{{
 "intencao": "reservar",
 "sala_tipo": "sala_aula",
 "capacidade_estimada": null,
 "data": "2025-12-01",
 "horario": "09:30"
}}

EXEMPLO 8:
Entrada:
"Quero usar o auditório hoje mais tarde"
Saída:
{{
 "intencao": "reservar",
 "sala_tipo": "auditorio",
 "capacidade_estimada": null,
 "data": null,
 "horario": null
}}

EXEMPLO 9:
Entrada:
"Cancelar sala de aula marcada para as 11"
Saída:
{{
 "intencao": "cancelar",
 "sala_tipo": "sala_aula",
 "capacidade_estimada": null,
 "data": null,
 "horario": "11:00"
}}

EXEMPLO 10:
Entrada:
"Preciso de qualquer sala às 15h"
Saída:
{{
 "intencao": "reservar",
 "sala_tipo": null,
 "capacidade_estimada": null,
 "data": null,
 "horario": "15:00"
}}

<|user|>
Mensagem: "{mensagem}"
<|end|>
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
            # Remover tokens especiais
            resposta_bruta = resposta_bruta.replace("<|assistant|>", "").replace("<|system|>", "").replace("<|user|>", "")

            # Procurar JSON com multiline mais tolerante
            match = re.findall(r"\{[\s\S]*\}", resposta_bruta)

            if not match:
                dados_json = {"erro": "JSON não encontrado", "bruto": resposta_bruta}
            else:
                try:
                    dados_json = json.loads(match[-1])
                except Exception:
                    dados_json = {"erro": "Falha ao decodificar JSON", "bruto": resposta_bruta}

            # retorno compatível com o Chat Inteligente
            return {
                "dados_extraidos": dados_json,
                "mensagem_amigavel": "Interpretei seu pedido. Validando regras de negócio...",
            }
        except Exception as e:
            return {
                "erro": f"Erro ao processar resposta: {str(e)}"
            }