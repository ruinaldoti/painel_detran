import sys
import os
from dotenv import load_dotenv
import math

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

from database import engine
from services.gemini_service import generate_embedding

def run_migration():
    print("Iniciando migração de Documentos para Assuntos...")
    
    with engine.begin() as conn:
        from sqlalchemy import text
        # 1. Obter assuntos únicos atrelados a áreas nos documentos
        query = text("""
            SELECT DISTINCT 
                d.assunto AS doc_assunto,
                d.id_area,
                a.area AS nome_area
            FROM public.documentos d
            JOIN public.area a ON a.id = d.id_area
            WHERE d.assunto IS NOT NULL AND d.id_area IS NOT NULL
        """)
        results = conn.execute(query).fetchall()
        
        print(f"Encontrados {len(results)} assuntos únicos na base de documentos.")
        
        for row in results:
            doc_assunto = row.doc_assunto.strip()
            id_area = row.id_area
            nome_area = row.nome_area.strip()
            
            # Verifica se já existe
            check_query = text("""
                SELECT id FROM public.assuntos 
                WHERE id_area = :id_area AND nome = :nome
            """)
            exists = conn.execute(check_query, {"id_area": id_area, "nome": doc_assunto}).fetchone()
            
            if exists:
                print(f"Assunto já existe: {doc_assunto} (Área: {nome_area}) - pulando")
                continue
                
            # Criação do contexto semântico focando apenas no Assunto (maior precisão semântica)
            contexto = doc_assunto
            print(f"Gerando embedding focado para assunto: '{contexto}'")
            
            try:
                vetor = generate_embedding(contexto)
                if vetor is None:
                    print(f"API indisponível (Cota Esgotada). Pulando assunto: {doc_assunto}")
                    continue

                embedding_str = "[" + ",".join(map(str, vetor)) + "]"
                
                insert_query = text("""
                    INSERT INTO public.assuntos (id_area, nome, contexto, embedding)
                    VALUES (:id_area, :nome, :contexto, :embedding::vector(768))
                """)
                conn.execute(insert_query, {
                    "id_area": id_area,
                    "nome": doc_assunto,
                    "contexto": contexto,
                    "embedding": embedding_str
                })
                print(f"Sucesso ao inserir: {doc_assunto}")
                
            except Exception as e:
                print(f"Erro ao processar assunto '{doc_assunto}': {e}")
                
    print("Migração concluída.")

if __name__ == "__main__":
    run_migration()
