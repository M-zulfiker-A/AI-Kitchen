from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
import PyPDF2
from sentence_transformers import SentenceTransformer
import openai

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

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# In-memory store for vectors and texts (for demo)
vector_store = {}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    # Extract text
    if file.filename.lower().endswith(".pdf"):
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = " ".join(page.extract_text() or "" for page in reader.pages)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    # Vectorize
    vectors = model.encode([text])
    vector_store[file.filename] = {"text": text, "vector": vectors[0]}
    return {"filename": file.filename, "message": "File uploaded and vectorized."}

@app.post("/chat-file/")
async def chat_file(filename: str = Form(...), query: str = Form(...)):
    if filename not in vector_store:
        return JSONResponse(status_code=404, content={"error": "File not found."})
    file_data = vector_store[filename]
    query_vec = model.encode([query])[0]
    # Simple cosine similarity
    import numpy as np
    sim = np.dot(file_data["vector"], query_vec) / (np.linalg.norm(file_data["vector"]) * np.linalg.norm(query_vec))
    # For demo, just return the text if similarity is high
    if sim > 0.5:
        return {"answer": file_data["text"][:1000], "similarity": float(sim)}
    else:
        return {"answer": "No relevant information found.", "similarity": float(sim)}

@app.post("/chat/")
async def chat(query: str = Form(...)):
    # Replace with your OpenAI API key or use env var
    openai.api_key = os.getenv("OPENAI_API_KEY", "sk-...your-key...")
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": query}]
        )
        answer = response.choices[0].message.content
    except Exception as e:
        answer = f"Error: {e}"
    return {"answer": answer}
