import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# LLM Configuration
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_CHAT_MODEL = os.getenv("LLM_CHAT_MODEL", "gpt-3.5-turbo")
LLM_EMBEDDING_MODEL = os.getenv("LLM_EMBEDDING_MODEL", "gemini-embedding-001")

# RAG / Prompt settings
# You can override this entire template via the RAG_PROMPT_TEMPLATE env var.
# Available placeholders: {context}, {question}
PROMPT_TEMPLATE = os.getenv(
    "RAG_PROMPT_TEMPLATE",
    (
        "You are a careful and concise assistant. Answer the user's question using ONLY the information in the provided context.\n"
        "- If the answer is not explicitly contained in the context, say you don't know.\n"
        "- Be concise and directly address the question.\n"
        "- If multiple sources are relevant, synthesize them.\n\n"
        "Context:\n{context}\n\n"
        "Question: {question}\n\n"
        "Answer:"
    ),
)

# Limit the total characters used from retrieved chunks to build {context}
RAG_MAX_CONTEXT_CHARS = int(os.getenv("RAG_MAX_CONTEXT_CHARS", "6000"))

