from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import auth, rag, chat

app = FastAPI(title="Painel Detran API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rag.router)
app.include_router(chat.router)

@app.on_event("startup")
def on_startup():
    from sqlmodel import Session
    from .database import engine, init_db
    init_db()
    
    # We also need to activate the vector extension in PostgreSQL
    with Session(engine) as session:
        session.exec("CREATE EXTENSION IF NOT EXISTS vector;")
        session.commit()

@app.get("/")
def read_root():
    return {"message": "Painel Detran API is running"}
