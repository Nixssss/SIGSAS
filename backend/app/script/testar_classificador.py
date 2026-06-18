from app.services.classificador import classificar



testes = [
    "quero reservar uma sala com projetor",
    "preciso cancelar minha sala",
    "tem sala disponível amanhã",
    "quero marcar laboratório de informática",
    "quero uma sala para reunião"
]


for frase in testes:
    resultado = classificar(frase)
    print(f"{frase} -> {resultado}")