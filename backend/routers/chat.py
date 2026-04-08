from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import DocumentoChunk, Area, Duvida
from services.gemini_service import generate_embedding, generate_chat_response, find_related_area

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    area: str | None = None  # área selecionada no widget (opcional)


@router.post("/")
def chat_with_bot(request: ChatRequest, db: Session = Depends(get_db)):
    query = request.message

    # 1. Gerar vetor da pergunta (reutilizado para busca vetorial E para matching de área)
    query_vector = generate_embedding(query)

    # 2. Busca semântica com pgvector (campo: vetor_embedding)
    try:
        results = db.query(DocumentoChunk).order_by(
            DocumentoChunk.vetor_embedding.l2_distance(query_vector)
        ).limit(5).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca vetorial: {str(e)}")

    # 3. Montar contexto a partir dos chunks recuperados
    context_parts = []
    for chunk in results:
        meta = chunk.metadata_ or {}
        parte = ""
        if meta.get("area"):
            parte += f"[Área: {meta['area']}] "
        if meta.get("titulo"):
            parte += f"[Documento: {meta['titulo']}] "
        parte += chunk.conteudo_texto
        context_parts.append(parte)

    context_text = "\n\n---\n\n".join(context_parts)

    # 4. Gerar resposta com o Gemini
    # Retorna {"reply": str, "answered": bool}
    result = generate_chat_response(query, context_text)
    answer = result["reply"]
    answered = result["answered"]

    # 5. Se não respondeu → tentar salvar na tabela duvidas
    if not answered:
        saved = _try_save_duvida(query=query, query_vector=query_vector, db=db, area_nome=request.area)
        if saved:
            answer = "No momento não tenho a resposta exata para a sua dúvida, mas guardei ela aqui com a nossa equipe! Quando você voltar da próxima vez, já poderei responder. 😊"

    return {
        "reply": answer,
        "contexts_used": len(results),
    }


from services.universo_detran import identificar_universo_detran

def _try_save_duvida(query: str, query_vector: list[float], db: Session, area_nome: str | None = None) -> bool:
    """
    Verifica se a pergunta é relacionada ao universo Detran.
    Se sim, salva na tabela `duvidas` com status 'pendente'.
    Se não (fora do escopo), descarta silenciosamente.
    """
    try:
        pertence = False
        id_area = None

        # 1. Se o frontend já enviou a área selecionada pelo usuário, usa ela primeiro!
        if area_nome:
            from models import Area
            area_obj = db.query(Area).filter(Area.area == area_nome).first()
            if area_obj:
                id_area = area_obj.id
                pertence = True

        # 2. Caso o frontend não tenha enviado, tenta por semântica de "Assuntos" (Documentos)
        if not id_area:
            pertence, id_area = identificar_universo_detran(query, db)

        # 3. Fallback: tentar por semântica das "Áreas" Gerais
        if not id_area:
            from models import Area
            from services.gemini_service import find_related_area
            areas = db.query(Area).all()
            id_area_str, _ = find_related_area(query_vector, areas)
            if id_area_str:
                id_area = id_area_str
                pertence = True

        if pertence and id_area:
            duvida = Duvida(
                duvida=query,
                id_area=id_area,
                status="pendente",
                origem="chat_publico",
            )
            db.add(duvida)
            db.commit()
            return True
            
        return False
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erro ao salvar duvida: {e}")
        db.rollback()
        return False
