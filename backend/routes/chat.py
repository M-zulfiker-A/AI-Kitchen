from fastapi import UploadFile, File, Form, HTTPException, APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
import os
import uuid
import PyPDF2
import json
import logging
from langchain_core.documents import Document
from services.embedding_service import _chunk_text, _embed_texts
from config import RAG_MAX_CONTEXT_CHARS

logger = logging.getLogger(__name__)

# Assume these are passed or imported from app
# chroma_client, collection, vectorstore, combine_chain, llm, openai_client, UPLOAD_DIR, COLLECTION_NAME

router = APIRouter()

@router.post("/upload/")
async def upload_file(request: Request, file: UploadFile = File(...)):
    chroma_client = request.app.state.chroma_client
    collection = request.app.state.collection
    openai_client = request.app.state.openai_client
    UPLOAD_DIR = request.app.state.UPLOAD_DIR
    COLLECTION_NAME = request.app.state.COLLECTION_NAME
    try:
        # Save the uploaded file with UUID prefix to avoid collisions
        safe_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        logger.info("Saved upload '%s' -> %s (%d bytes)", file.filename, file_path, os.path.getsize(file_path))

        # Extract text
        if file.filename.lower().endswith(".pdf"):
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                pages = len(reader.pages)
                text = " ".join(page.extract_text() or "" for page in reader.pages)
            logger.info("Extracted text from PDF: %d pages, %d chars", pages, len(text))
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            logger.info("Extracted text from non-PDF: %d chars", len(text))

        if not text or not text.strip():
            logger.warning("No extractable text found in uploaded file: %s", file.filename)
            raise HTTPException(status_code=400, detail="No extractable text found in the uploaded file.")

        # Chunk the text to respect embedding limits
        chunks = _chunk_text(text)
        if not chunks:
            logger.warning("Chunking produced no chunks for file: %s", file.filename)
            raise HTTPException(status_code=400, detail="Document produced no valid chunks for embedding.")

        logger.info("Embedding %d chunks for file: %s", len(chunks), file.filename)
        vectors = _embed_texts(chunks, openai_client)

        # Generate a base ID for the document
        base_id = str(uuid.uuid4())

        # Store in ChromaDB
        ids = [f"{base_id}-{i}" for i in range(len(chunks))]
        metadatas = [{"filename": file.filename, "path": file_path, "chunk_index": i} for i in range(len(chunks))]
        collection.add(
            documents=chunks,
            embeddings=vectors,
            metadatas=metadatas,
            ids=ids,
        )
        logger.info("Stored %d chunks in Chroma collection '%s'", len(chunks), COLLECTION_NAME)

        return {
            "id": base_id,
            "filename": file.filename,
            "message": f"File uploaded and vectorized into {len(chunks)} chunks."
        }
    except HTTPException:
        # Pass through known HTTP errors
        raise
    except Exception as e:
        logger.exception("Upload failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/chat-file/")
async def chat_file(request: Request, query: str = Form(...), n_results: int = Form(3)):
    vectorstore = request.app.state.vectorstore
    combine_chain = request.app.state.combine_chain
    collection = request.app.state.collection
    try:
        # Use LangChain retriever over Chroma
        retriever = vectorstore.as_retriever(search_kwargs={"k": min(int(n_results), 10)})

        # Fetch relevant documents
        lc_docs = retriever.get_relevant_documents(query)
        if not lc_docs:
            return {"answer": "No relevant information found.", "sources": []}

        # Truncate page_content across docs to respect RAG_MAX_CONTEXT_CHARS
        used = 0
        trimmed_docs = []
        for d in lc_docs:
            text = d.page_content or ""
            if not text:
                # Fallback: attempt fetch from raw Chroma collection by metadata
                meta = d.metadata or {}
                where = {}
                for k in ("filename", "chunk_index"):
                    if k in meta:
                        where[k] = meta[k]
                try:
                    if where:
                        got = collection.get(where=where, include=["documents"])
                        if got and got.get("documents"):
                            text = (got["documents"][0] or "")
                except Exception as e:
                    logger.debug("Fallback fetch from collection failed: %s", e)

            if not text:
                continue

            remaining = max(RAG_MAX_CONTEXT_CHARS - used, 0)
            if remaining <= 0:
                break
            snippet = text if len(text) <= remaining else text[:remaining]
            trimmed_docs.append(Document(page_content=snippet, metadata=d.metadata))
            used += len(snippet)

        # Run the combine-docs chain with the trimmed docs and the user's question
        try:
            final_answer = combine_chain.invoke({
                "context": trimmed_docs,
                "question": query,
            })
        except Exception as e:
            logger.exception("LLM combine chain failed: %s", e)
            raise HTTPException(status_code=500, detail=f"LLM request failed: {str(e)}")

        # Build sources list from retrieved docs
        sources = []
        for i, d in enumerate(lc_docs):
            meta = d.metadata or {}
            text = d.page_content or ""
            sources.append({
                "filename": meta.get("filename", meta.get("source", f"source-{i}")),
                "score": meta.get("score"),  # may be unavailable
                "text": (text[:500] + "...") if len(text) > 500 else text,
            })

        return {
            "answer": (str(final_answer) if final_answer is not None else "").strip()[:4000],
            "sources": sources,
        }
    except Exception as e:
        logger.exception("chat-file failed: %s", e)
        raise HTTPException(status_code=500, detail=f"chat-file failed: {str(e)}")

@router.post("/chat/")
async def chat(request: Request, query: str = Form(...)):
    llm = request.app.state.llm
    async def generate():
        try:
            # Stream the response from the LLM
            for chunk in llm.stream(query):
                if chunk.content:
                    # Send each chunk as a JSON object with a newline delimiter
                    yield f"data: {json.dumps({'content': chunk.content})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    # Add standard SSE headers for better compatibility
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable buffering on some proxies like Nginx
        },
    )


@router.post("/chat-file-stream/")
async def chat_file_stream(request: Request, query: str = Form(...), n_results: int = Form(3)):
    vectorstore = request.app.state.vectorstore
    llm = request.app.state.llm
    collection = request.app.state.collection
    """Stream RAG-grounded answer tokens via SSE using the retriever and prompt template."""
    try:
        # Prepare retriever and fetch docs
        retriever = vectorstore.as_retriever(search_kwargs={"k": min(int(n_results), 10)})
        lc_docs = retriever.get_relevant_documents(query)
        if not lc_docs:
            # No docs; stream a single message
            async def no_docs():
                yield f"data: {json.dumps({'content': 'No relevant information found.'})}\n\n"
            return StreamingResponse(no_docs(), media_type="text/event-stream")

        # Build context string within the character budget (include labels for clarity)
        used = 0
        context_parts: List[str] = []
        sources = []
        for i, d in enumerate(lc_docs):
            text = d.page_content or ""
            if not text:
                continue
            remaining = max(RAG_MAX_CONTEXT_CHARS - used, 0)
            if remaining <= 0:
                break
            snippet = text if len(text) <= remaining else text[:remaining]
            meta = d.metadata or {}
            label = meta.get("filename", meta.get("source", f"source-{i}"))
            context_parts.append(f"Source {i+1} ({label}):\n{snippet}")
            used += len(snippet)
            sources.append({
                "filename": label,
                "score": meta.get("score"),
                "text": (text[:500] + "...") if len(text) > 500 else text,
            })
        context = "\n\n".join(context_parts)

        # Format the prompt
        from config import PROMPT_TEMPLATE
        prompt = PROMPT_TEMPLATE.format(context=context, question=query)

        async def generate():
            try:
                for chunk in llm.stream(prompt):
                    if chunk.content:
                        yield f"data: {json.dumps({'content': chunk.content})}\n\n"
                # finally, send sources metadata
                yield f"data: {json.dumps({'done': True, 'sources': sources})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        logger.exception("chat-file-stream failed: %s", e)
        raise HTTPException(status_code=500, detail=f"chat-file-stream failed: {str(e)}")
