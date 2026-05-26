from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

senha = "123456"

hash_gerado = pwd_context.hash(senha)

print(hash_gerado)