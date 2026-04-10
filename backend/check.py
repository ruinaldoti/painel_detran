import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
conn = psycopg2.connect(host="detran-projetosn8n-segxsa", port=5432, dbname="painel_chat", user="postgres", password="Rer34QW!@ui")
cur = conn.cursor()
cur.execute("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'usuarios_perfil_check'")
print(cur.fetchall())
