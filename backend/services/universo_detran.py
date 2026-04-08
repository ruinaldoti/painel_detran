import math
from sqlalchemy.orm import Session
from uuid import UUID
from services.gemini_service import generate_embedding

# Threshold parameter as mentioned in spec
def identificar_universo_detran(pergunta: str, db: Session, threshold: float = 0.35) -> tuple[bool, UUID | None]:
    """
    Verifica se a pergunta pertence ao universo do Detran.
    
    Retorna:
        (True, id_area)  → pertence ao universo, com área mais próxima
        (False, None)    → fora do universo Detran
    """
    # 1. Gerar embedding da pergunta
    embedding_pergunta = generate_embedding(pergunta)
    
    # 2. Buscar assunto mais similar por cosine similarity
    # Assumindo query bruta via text() do SQLAlchemy
    from sqlalchemy import text
    query = text("""
        SELECT 
            a.id,
            a.id_area,
            a.nome,
            a.contexto,
            1 - (a.embedding <=> :embedding::vector(768)) AS similaridade
        FROM public.assuntos a
        ORDER BY a.embedding <=> :embedding::vector(768)
        LIMIT 1
    """)
    
    # Cast necessary for pgvector raw queries: stringify the list
    embedding_str = "[" + ",".join(map(str, embedding_pergunta)) + "]"
    
    resultado = db.execute(query, {"embedding": embedding_str}).fetchone()
    
    # 3. Avaliar threshold
    if resultado and resultado.similaridade >= threshold:
        return True, resultado.id_area
    
    return False, None
