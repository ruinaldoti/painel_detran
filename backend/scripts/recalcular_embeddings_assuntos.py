import sys
import os
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

from database import engine
from services.gemini_service import generate_embedding
from sqlalchemy import text

def repopular_embeddings():
    print("Iniciando recalculo de embeddings para a tabela 'assuntos'...")
    
    with engine.begin() as conn:
        # Pega todos os assuntos
        query = text("""
            SELECT id, nome FROM public.assuntos
        """)
        resultados = conn.execute(query).fetchall()
        
        print(f"Encontrados {len(resultados)} assuntos para atualizar.")
        
        for linha in resultados:
            assunto_id = linha.id
            nome = linha.nome.strip()
            
            print(f"Gerando novo embedding apenas para a palavra-chave: '{nome}'")
            
            try:
                # Gera o vetor SOMENTE usando o nome limpo (ex: "HABILITAÇÃO - GERAL")
                vetor = generate_embedding(nome)
                embedding_str = "[" + ",".join(map(str, vetor)) + "]"
                
                # Executa o UPDATE no banco
                update_query = text("""
                    UPDATE public.assuntos 
                    SET embedding = :embedding::vector(768)
                    WHERE id = :id
                """)
                
                conn.execute(update_query, {
                    "embedding": embedding_str,
                    "id": assunto_id
                })
                print(f"✅ Atualizado com sucesso: {nome}")
                
            except Exception as e:
                print(f"❌ Erro ao processar assunto '{nome}': {e}")
                
    print("Recálculo concluído com sucesso!")

if __name__ == "__main__":
    repopular_embeddings()
