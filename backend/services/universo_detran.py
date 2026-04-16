import os
from sqlalchemy.orm import Session
from uuid import UUID
from services.gemini_service import generate_embedding

def identificar_universo_detran(pergunta: str, db: Session, threshold: float = None) -> tuple[bool, UUID | None, UUID | None]:
    """
    Verifica se a pergunta pertence ao universo do Detran.
    
    Retorna:
        (True, id_area, id_assunto)  → pertence ao universo, com área e assunto mais próximos
        (False, None, None)          → fora do universo Detran
    """
    try:
        # Se threshold não for passado explicitamente, lê do ambiente ou usa 0.75 (default mais rigoroso)
        if threshold is None:
            threshold = float(os.getenv("UNIVERSO_DETRAN_THRESHOLD", "0.75"))

        # 1. Gerar embedding da pergunta
        embedding_pergunta = generate_embedding(pergunta)
        
        # 2. Buscar assunto mais similar por cosine similarity
        from sqlalchemy import text
        query = text("""
            SELECT 
                a.id,
                a.id_area,
                a.nome,
                a.contexto,
                1 - (a.embedding <=> CAST(:embedding AS vector(768))) AS similaridade
            FROM public.assuntos a
            ORDER BY a.embedding <=> CAST(:embedding AS vector(768))
            LIMIT 1
        """)
        
        # Cast necessary for pgvector raw queries: stringify the list
        embedding_str = "[" + ",".join(map(str, embedding_pergunta)) + "]"
        
        resultado = db.execute(query, {"embedding": embedding_str}).fetchone()
        
        # 3. Avaliar threshold
        if resultado and resultado.similaridade >= threshold:
            return True, resultado.id_area, resultado.id
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erro em identificar_universo_detran: {e}")
        
    return False, None, None
