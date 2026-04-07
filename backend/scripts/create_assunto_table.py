import sys
import os
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

from database import engine

def create_table():
    sql = """
    CREATE TABLE IF NOT EXISTS public.assunto (
        id         SERIAL PRIMARY KEY,
        id_area    UUID NOT NULL REFERENCES public.area(id) ON DELETE CASCADE,
        assunto    VARCHAR(255) NOT NULL,
        contexto   TEXT NOT NULL,
        embedding  vector(768),
        criado_em  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_assunto_embedding 
    ON public.assunto 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 10);
    """
    with engine.connect() as conn:
        conn.execute(sql)
        print("Tabela 'assunto' e índice ivfflat criados/verificados com sucesso.")

if __name__ == "__main__":
    create_table()
