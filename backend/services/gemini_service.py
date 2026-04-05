import os
from google import genai
from google.genai import types

# Using the new Google GenAI SDK interface.
# Note: google-genai package gets initialized without API explicit passing if environment GOOGLE_API_KEY is available.
# We'll configure it directly using the env variable.

API_KEY = os.getenv("GEMINI_API_KEY", "")

def get_client():
    from google import genai
    return genai.Client(api_key=API_KEY)

def generate_embedding(text: str) -> list[float]:
    client = get_client()
    # gemini-text-embedding-004 is recommended for general text embeddings
    response = client.models.embed_content(
        model="text-embedding-004",   
        contents=text,
    )
    return response.embeddings[0].values

def generate_chat_response(query: str, context: str) -> str:
    client = get_client()
    prompt = f"""
Você é um assistente do Detran. Utilize o CONTEXTO FORNECIDO abaixo para responder à PERGUNTA do agente de atendimento.
Se você não souber a resposta com base no contexto, responda que não tem a informação nos manuais carregados. Não invente leis ou regras.

CONTEXTO FORNECIDO:
{context}

PERGUNTA:
{query}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text
