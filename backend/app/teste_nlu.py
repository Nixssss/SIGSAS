from services.nluservice import interpretar_frase

while True:
    frase = input("Digite: ")

    resultado = interpretar_frase(frase)

    print(resultado)