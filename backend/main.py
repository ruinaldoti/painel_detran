from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, rag, chat, areas, duvidas
import os

app = FastAPI(title="Painel Detran API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas
app.include_router(auth.router)
app.include_router(rag.router)
app.include_router(chat.router)
app.include_router(areas.router)
app.include_router(duvidas.router)

# Como as tabelas já existem, não precisamos do lifecycle (Base.metadata.create_all).
# Apenas rodamos a API esperando o banco já existir!

@app.get("/")
def read_root():
    return {"message": "Painel Detran API executando. Banco: " + os.environ.get("DB_NAME", "postgree")}
