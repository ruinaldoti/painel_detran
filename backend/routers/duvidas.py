from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
from database import get_db
from models import Duvida, Area, Assunto, Usuario, Documento, DocumentoChunk
from routers.auth import get_current_user
from services.gemini_service import generate_embedding

router = APIRouter(prefix="/duvidas", tags=["duvidas"])


# ──────────────────────────── Schemas ────────────────────────────

class ResponderRequest(BaseModel):
    resposta: str

class EditarRequest(BaseModel):
    resposta: str


# ──────────────────────────── Serializer ────────────────────────────

def _serialize(duvida: Duvida, is_ingerido: bool = False) -> dict:
    return {
        "id": str(duvida.id),
        "duvida": duvida.duvida,
        "resposta": duvida.resposta,
        "id_area": str(duvida.id_area) if duvida.id_area else None,
        "area_nome": duvida.area.area if duvida.area else None,
        "assunto_nome": duvida.assunto_rel.nome if duvida.assunto_rel else None,
        "status": duvida.status,
        "criado_em": duvida.criado_em,
        "respondido_em": duvida.respondido_em,
        "origem": duvida.origem,
        "ingerido_no_rag": is_ingerido,
    }


# ──────────────────────────── RAG Helpers ────────────────────────────

def _ingest_into_rag(duvida: Duvida, resposta: str, db: Session) -> Documento:
    """
    Cria um Documento + DocumentoChunk com o par Pergunta/Resposta.
    Deve ser chamado dentro de uma transação aberta.
    Usa db.flush() para obter IDs sem fazer commit.
    """
    area_nome = duvida.area.area if duvida.area else "Geral"
    titulo = f"Dúvida: {duvida.duvida[:80]}"
    nome_arquivo = f"duvida_{str(duvida.id)}.txt"

    # 1. Criar registro em documentos
    doc = Documento(
        titulo=titulo,
        assunto=area_nome,
        id_area=duvida.id_area,
        nome_arquivo=nome_arquivo,
    )
    db.add(doc)
    db.flush()  # necessário para obter doc.id antes do commit

    # 2. Construir texto para embedding (par Pergunta + Resposta)
    texto = f"Pergunta: {duvida.duvida}\nResposta: {resposta}"

    # 3. Gerar embedding via Gemini (768 dimensões)
    embedding_vector = generate_embedding(texto)
    if embedding_vector is None:
        raise Exception("A API de Inteligência Artificial está indisponível (Cota Esgotada). Não foi possível responder a dúvida neste momento.")

    # 4. Criar chunk com metadados estruturados
    chunk = DocumentoChunk(
        documento_id=doc.id,
        conteudo_texto=texto,
        vetor_embedding=embedding_vector,
        metadata_={
            "titulo": titulo,
            "assunto": area_nome,
            "area": area_nome,
            "nome_arquivo": nome_arquivo,
            "tipo": "duvida_respondida",
            "duvida_id": str(duvida.id),
        },
    )
    db.add(chunk)
    return doc


def _remove_from_rag(duvida: Duvida, db: Session) -> None:
    """
    Remove Documento + DocumentoChunks associados a esta dúvida do RAG.
    Mapeia pelo nome_arquivo da dúvida.
    Deve ser chamado dentro de uma transação aberta.
    """
    nome_arquivo = f"duvida_{str(duvida.id)}.txt"
    doc = db.query(Documento).filter(Documento.nome_arquivo == nome_arquivo).first()
    
    if not doc:
        return

    # Remover chunks primeiro (integridade referencial)
    db.query(DocumentoChunk).filter(
        DocumentoChunk.documento_id == doc.id
    ).delete(synchronize_session=False)

    # Remover documento
    db.delete(doc)


# ──────────────────────────── Endpoints ────────────────────────────

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Contagens por status para cards e badge do menu lateral."""
    total = db.query(func.count(Duvida.id)).scalar() or 0
    pendentes = (
        db.query(func.count(Duvida.id))
        .filter(Duvida.status == "pendente")
        .scalar() or 0
    )
    respondidas = (
        db.query(func.count(Duvida.id))
        .filter(Duvida.status == "respondido")
        .scalar() or 0
    )

    # 1. Agrupamento por Área
    chart_area_query = (
        db.query(
            Area.area.label("area_nome"),
            func.count(Duvida.id).label("total")
        )
        .join(Area, Duvida.id_area == Area.id)
        .group_by(Area.area)
        .all()
    )
    
    chart_area = [
        {
            "nome": row.area_nome,
            "total": row.total
        }
        for row in chart_area_query
    ]

    # 2. Agrupamento por Assunto
    chart_assunto_query = (
        db.query(
            Assunto.nome.label("assunto_nome"),
            func.count(Duvida.id).label("total")
        )
        .join(Assunto, Duvida.id_assunto == Assunto.id)
        .group_by(Assunto.nome)
        .all()
    )

    chart_assunto = [
        {"nome": row.assunto_nome, "total": row.total}
        for row in chart_assunto_query
    ]

    return {
        "total": total, 
        "pendentes": pendentes, 
        "respondidas": respondidas,
        "chart_area": chart_area,
        "chart_assunto": chart_assunto
    }


@router.get("/")
def list_duvidas(
    status: Optional[str] = Query(None, description="pendente | respondido"),
    id_area: Optional[str] = Query(None),
    periodo_dias: Optional[int] = Query(None, description="7 | 30 | None=todos"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista dúvidas com filtros por status, área e período."""
    q = db.query(Duvida)

    if status:
        q = q.filter(Duvida.status == status)
    if id_area:
        q = q.filter(Duvida.id_area == id_area)
    if periodo_dias:
        cutoff = datetime.utcnow() - timedelta(days=periodo_dias)
        q = q.filter(Duvida.criado_em >= cutoff)

    duvidas = q.order_by(Duvida.criado_em.desc()).offset(skip).limit(limit).all()
    
    # Preload para verificar se estão ingeridos (buscar titulos de documentos)
    nomes_arquivos = [f"duvida_{str(d.id)}.txt" for d in duvidas]
    docs_existentes = db.query(Documento.nome_arquivo).filter(Documento.nome_arquivo.in_(nomes_arquivos)).all()
    docs_set = {d[0] for d in docs_existentes}
    
    return [_serialize(d, f"duvida_{str(d.id)}.txt" in docs_set) for d in duvidas]


@router.get("/{duvida_id}")
def get_duvida(
    duvida_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Detalhe de uma dúvida específica."""
    duvida = db.query(Duvida).filter(Duvida.id == duvida_id).first()
    if not duvida:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada")
        
    nome_arquivo = f"duvida_{str(duvida.id)}.txt"
    is_ingerido = db.query(Documento).filter(Documento.nome_arquivo == nome_arquivo).first() is not None
    return _serialize(duvida, is_ingerido)


@router.put("/{duvida_id}/responder")
def responder_duvida(
    duvida_id: int,
    body: ResponderRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Salva resposta + altera status para 'respondido' + ingere par Q/A no RAG.
    Operação atômica: rollback total se qualquer etapa falhar.
    """
    duvida = db.query(Duvida).filter(Duvida.id == duvida_id).first()
    if not duvida:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada")
    if not body.resposta.strip():
        raise HTTPException(status_code=400, detail="A resposta não pode estar vazia")

    try:
        # 1. Salvar resposta
        duvida.resposta = body.resposta.strip()
        duvida.status = "respondido"
        duvida.respondido_em = datetime.utcnow()

        # 2. Se duvida já estava ingerida no RAG, remover versão antiga
        _remove_from_rag(duvida, db)

        # 3. Ingerir novo par Q/A no RAG
        doc = _ingest_into_rag(duvida, body.resposta.strip(), db)

        # 4. Commit atômico (tudo ou nada)
        db.commit()
        db.refresh(duvida)
        return _serialize(duvida, True)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar resposta e ingerir no RAG: {str(e)}"
        )


@router.put("/{duvida_id}/editar")
def editar_duvida(
    duvida_id: str,
    body: EditarRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Atualiza resposta existente + re-ingere no RAG (remove versão antiga, cria nova).
    Operação atômica.
    """
    duvida = db.query(Duvida).filter(Duvida.id == duvida_id).first()
    if not duvida:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada")
    if not body.resposta.strip():
        raise HTTPException(status_code=400, detail="A resposta não pode estar vazia")

    try:
        # 1. Atualizar campos da dúvida (status se mantém 'respondido')
        duvida.resposta = body.resposta.strip()
        duvida.respondido_em = datetime.utcnow()

        # 2. Remover versão antiga do RAG
        _remove_from_rag(duvida, db)

        # 3. Re-ingerir com nova resposta
        doc = _ingest_into_rag(duvida, body.resposta.strip(), db)

        db.commit()
        db.refresh(duvida)
        return _serialize(duvida, True)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao editar resposta e re-ingerir no RAG: {str(e)}"
        )


@router.delete("/{duvida_id}")
def delete_duvida(
    duvida_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Remove a dúvida e, se existir, também remove o documento/chunk do RAG.
    Operação atômica.
    """
    duvida = db.query(Duvida).filter(Duvida.id == duvida_id).first()
    if not duvida:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada")

    try:
        _remove_from_rag(duvida, db)
        db.delete(duvida)
        db.commit()
        return {"message": "Dúvida e dados do RAG removidos com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao excluir dúvida: {str(e)}"
        )
