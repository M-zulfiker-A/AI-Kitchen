from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import chromadb
from chromadb.config import Settings
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from openai import OpenAI
import logging
from config import (
    LLM_BASE_URL,
    LLM_API_KEY,
    LLM_CHAT_MODEL,
    LLM_EMBEDDING_MODEL,
    PROMPT_TEMPLATE,
)
from services.embedding_service import OpenAIEmbeddingsAdapter
from routes.chat import router as chat_router

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize OpenAI-compatible client for embeddings
try:
    openai_client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
    logger.info("Initialized OpenAI-compatible client for embeddings with model '%s'", LLM_EMBEDDING_MODEL)
except Exception as e:
    logger.exception("Failed to initialize OpenAI client: %s", e)
    raise

# Initialize ChromaDB with the new persistent client
chroma_client = chromadb.PersistentClient(path=".chromadb")

# Create or get the collection
COLLECTION_NAME = "documents"
collection = chroma_client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"}
)

# Initialize LangChain ChatOpenAI with config
llm = ChatOpenAI(
    base_url=LLM_BASE_URL,
    api_key=LLM_API_KEY,
    model=LLM_CHAT_MODEL,
    temperature=0.7
)

# Point the LangChain Chroma wrapper to the same persistent DB/collection
vectorstore = Chroma(
    client=chroma_client,
    collection_name=COLLECTION_NAME,
    embedding_function=OpenAIEmbeddingsAdapter(openai_client),
)

# Build a ChatPromptTemplate aligned with PROMPT_TEMPLATE
prompt_tmpl = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)

# Stuff-documents chain expects a variable holding the joined docs; we'll call it "context"
combine_chain = create_stuff_documents_chain(llm, prompt_tmpl, document_variable_name="context")

# Include routers
app.include_router(chat_router)

# Dependency injection for routes - since routes need access to these, we can pass them via app.state or use dependencies
app.state.chroma_client = chroma_client
app.state.collection = collection
app.state.openai_client = openai_client
app.state.UPLOAD_DIR = UPLOAD_DIR
app.state.COLLECTION_NAME = COLLECTION_NAME
app.state.vectorstore = vectorstore
app.state.combine_chain = combine_chain
app.state.llm = llm
