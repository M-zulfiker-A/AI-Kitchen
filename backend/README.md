# AI-Kitchen Backend

This is a FastAPI backend for:
- Uploading and vectorizing text files (PDF, TXT, etc.)
- Chatting with AI to retrieve information from uploaded files
- Normal chat with an AI model (OpenAI GPT)

## Endpoints

### 1. Upload and Vectorize File
`POST /upload/`
- Form-data: `file` (PDF or TXT)
- Returns: filename, message

### 2. Chat with Uploaded File
`POST /chat-file/`
- Form-data: `filename`, `query`
- Returns: answer, similarity

### 3. Normal AI Chat
`POST /chat/`
- Form-data: `query`
- Returns: answer

## Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Set your OpenAI API key as an environment variable:
```bash
export OPENAI_API_KEY=sk-...your-key...
```
