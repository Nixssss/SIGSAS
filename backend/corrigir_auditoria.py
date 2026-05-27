import sqlite3

CAMINHO_BANCO = "sigsas_interno.db"

colunas = [
    ("ipMaquina", "VARCHAR"),
    ("sessionId", "VARCHAR"),
    ("etapa", "VARCHAR"),
]

conn = sqlite3.connect(CAMINHO_BANCO)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(auditoria)")
colunas_existentes = [coluna[1] for coluna in cursor.fetchall()]

for nome_coluna, tipo_coluna in colunas:
    if nome_coluna not in colunas_existentes:
        cursor.execute(f"ALTER TABLE auditoria ADD COLUMN {nome_coluna} {tipo_coluna}")
        print(f"Coluna adicionada: {nome_coluna}")
    else:
        print(f"Coluna já existe: {nome_coluna}")

conn.commit()
conn.close()

print("Tabela auditoria corrigida com sucesso.")