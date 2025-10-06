from typing import List
import logging
from openai import OpenAI
from langchain_core.embeddings import Embeddings
from config import LLM_EMBEDDING_MODEL

logger = logging.getLogger(__name__)

# Assume openai_client is passed or imported, but better to pass it
def _chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> List[str]:
    """Simple character-based chunking with overlap to avoid exceeding limits.
    Adjust sizes to suit the embedding provider's constraints.
    """
    if not text:
        return []
    chunks: List[str] = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end]
        # Avoid empty/whitespace-only chunks
        if chunk.strip():
            chunks.append(chunk)
        if end == length:
            break
        start = end - overlap if end - overlap > start else end
    return chunks


def _embed_texts(texts: List[str], openai_client: OpenAI) -> List[List[float]]:
    """Embed a list of texts using the OpenAI-compatible embeddings endpoint."""
    try:
        resp = openai_client.embeddings.create(model=LLM_EMBEDDING_MODEL, input=texts)
        # Some providers (e.g., Gemini OpenAI-compatible) may not set item.index; rely on order
        data = getattr(resp, "data", [])
        if not isinstance(data, list) or len(data) != len(texts):
            raise ValueError(
                f"Embedding response size mismatch: expected {len(texts)} items, got {len(data)}"
            )

        vectors: List[List[float]] = [None] * len(data)  # type: ignore
        for i, item in enumerate(data):
            # Support both attribute access and dict access
            embedding = getattr(item, "embedding", None)
            if embedding is None and isinstance(item, dict):
                embedding = item.get("embedding")
            if embedding is None:
                raise ValueError(f"Missing 'embedding' at position {i} in embeddings response")
            vectors[i] = embedding

        return vectors
    except Exception as e:
        logger.exception("Embeddings request failed: %s", e)
        raise


def _embed_query(text: str, openai_client: OpenAI) -> List[float]:
    vecs = _embed_texts([text], openai_client)
    return vecs[0]


class OpenAIEmbeddingsAdapter(Embeddings):
    """LangChain Embeddings interface backed by our OpenAI-compatible client.

    This ensures embeddings come from the openai library, not langchain wrappers.
    """
    def __init__(self, openai_client: OpenAI):
        self.openai_client = openai_client

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return _embed_texts(texts, self.openai_client)

    def embed_query(self, text: str) -> List[float]:
        return _embed_query(text, self.openai_client)
