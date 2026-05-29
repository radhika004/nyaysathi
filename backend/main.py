from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uvicorn
import os
import math
from datetime import datetime, timezone
import json
import hashlib
import secrets
from uuid import uuid4
from pymongo import MongoClient, ReturnDocument
from pymongo.errors import DuplicateKeyError
from groq import Groq

# Load .env file for local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, use system env vars (production)

# --- CONFIGURATION ---
CHROMA_PATH = os.getenv("CHROMA_PATH", "/app/chroma_db")
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGODB_DB", "Legal_AI")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:9002")

# --- GROQ CLIENT ---
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# --- DATABASE SETUP ---
try:
    mongo_client = MongoClient(MONGO_URI)
    mongo_db = mongo_client[MONGO_DB_NAME]
    users_collection = mongo_db["users"]
    lawyers_collection = mongo_db["lawyers"]
    chat_sessions_collection = mongo_db["chat_sessions"]

    users_collection.create_index("email", unique=True)
    lawyers_collection.create_index("email", unique=True)
    chat_sessions_collection.create_index("owner_email")
    chat_sessions_collection.create_index("session_id", unique=True)
except Exception as e:
    print(f"MongoDB Connection Warning: {e}")

# --- MODELS ---
class SignupRequest(BaseModel):
    role: Literal["user", "lawyer"]
    name: str = Field(min_length=2)
    email: str
    password: str = Field(min_length=4)
    domain: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    token: str
    name: str
    role: str

class Lawyer(BaseModel):
    id: str
    name: str
    email: str
    domain: str
    latitude: float
    longitude: float
    phone: Optional[str] = None

class NearbyQuery(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 25.0
    domain: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    language: str = "English"
    session_id: Optional[str] = None

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime

class ChatResponse(BaseModel):
    session_id: str
    title: str
    messages: List[ChatMessage]
    answer: str
    updated_at: datetime

class ChatSessionSummary(BaseModel):
    id: str
    title: str
    updated_at: datetime

class ChatSessionDetail(BaseModel):
    id: str
    title: str
    messages: List[ChatMessage]
    updated_at: datetime

# --- APP SETUP ---
app = FastAPI(title="NyaySathi AI Legal API")

# Build CORS origins list
allowed_origins = [
    "http://localhost:9002",
    "http://localhost:3000",
    "http://127.0.0.1:9002",
    "http://127.0.0.1:3000",
]
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- UTILS ---
def _hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return hashed, salt

def _verify_password(password: str, hashed: str, salt: str) -> bool:
    check_hash = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return check_hash == hashed

def _generate_token() -> str:
    return secrets.token_hex(32)

def _email_from_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split("Bearer ", 1)[1].strip()
    if token.startswith("localtoken::"):
        return token.split("::", 1)[1]
    user = users_collection.find_one({"auth_token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user["email"]

def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def _now():
    return datetime.now(timezone.utc)

# --- RAG LOGIC ---
try:
    import chromadb
    print(f"Attempting to load ChromaDB from: {CHROMA_PATH}")
    print(f"Path exists: {os.path.exists(CHROMA_PATH)}")
    if os.path.exists(CHROMA_PATH):
        print(f"Files in chroma_db: {os.listdir(CHROMA_PATH)}")
    CHROMA_CLIENT = chromadb.PersistentClient(path=CHROMA_PATH)
    collections = CHROMA_CLIENT.list_collections()
    print(f"Available collections: {[c.name for c in collections]}")
    COLLECTION = CHROMA_CLIENT.get_collection("law_sections")
    print(f"ChromaDB loaded successfully from {CHROMA_PATH}")
except Exception as e:
    print(f"RAG Load Warning: {e}")
    COLLECTION = None

def _build_prompt(query: str, language: str = "English") -> str:
    context = ""
    if COLLECTION:
        try:
            results = COLLECTION.query(query_texts=[query], n_results=5)
            docs = results.get("documents", [[]])[0]
            context_list = []
            for doc in docs:
                try:
                    parsed = json.loads(doc)
                    context_list.append(json.dumps(parsed, indent=2, ensure_ascii=False))
                except:
                    context_list.append(doc)
            context = "\n\n---\n\n".join(context_list)
        except Exception as e:
            print(f"Query Error: {e}")

    prompt = f"""You are a helpful legal assistant like a lawyer specializing in the Indian Law. Behave like a lawyer and give answers.
Use ONLY the context below to answer the question clearly in {language}.
If the answer is not found in the context dont say that you have not found anything in context directly start answering the question using your general knowledge of Indian Law to provide a logical, statute-aware answer.
Respond in simple, easy-to-understand language. Also keep in mind that you are answering normal citizens who dont have knowledge of the law so be clear and explain in simple text which can be understood by anyone. Give detailed answers with example to explain situation if required.
Dont use bold text and at any cost keep the text simple and dont use difficult words. Dont use ** symbols for anything.

CONTEXT:
---
{context}
---

QUESTION: {query}
ANSWER:"""
    return prompt

def _rag_answer(query: str, language: str = "English") -> str:
    """Non-streaming RAG answer using Groq."""
    if not groq_client:
        return "LLM Error: GROQ_API_KEY is not configured. Please set the GROQ_API_KEY environment variable."
    prompt = _build_prompt(query, language)
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.3
        )
        return response.choices[0].message.content or "I could not generate an answer."
    except Exception as e:
        return f"LLM Error: {str(e)}"

# --- HEALTH CHECK ---
@app.get("/health")
def health_check():
    return {"status": "ok", "groq": bool(groq_client), "chroma": bool(COLLECTION)}

# --- AUTH ENDPOINTS ---
@app.post("/auth/signup", response_model=TokenResponse)
def signup(body: SignupRequest):
    email = body.email.lower().strip()
    hashed, salt = _hash_password(body.password)
    token = _generate_token()
    try:
        users_collection.insert_one({
            "role": body.role,
            "name": body.name,
            "email": email,
            "password_hash": hashed,
            "password_salt": salt,
            "password": body.password,
            "phone": body.phone,
            "auth_token": token,
            "created_at": _now()
        })
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already exists")
    if body.role == "lawyer":
        lawyers_collection.update_one(
            {"email": email},
            {"$set": {
                "name": body.name, "email": email,
                "domain": body.domain or "General",
                "latitude": body.latitude or 0.0,
                "longitude": body.longitude or 0.0,
                "phone": body.phone
            }},
            upsert=True
        )
    return TokenResponse(token=token, name=body.name, role=body.role)

@app.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest):
    email = body.email.lower().strip()
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    password_valid = False
    if "password_hash" in user and "password_salt" in user:
        password_valid = _verify_password(body.password, user["password_hash"], user["password_salt"])
    if not password_valid:
        if user.get("password") == body.password:
            password_valid = True
            hashed, salt = _hash_password(body.password)
            users_collection.update_one(
                {"email": email},
                {"$set": {"password_hash": hashed, "password_salt": salt}}
            )
    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _generate_token()
    users_collection.update_one({"email": email}, {"$set": {"auth_token": token}})
    return TokenResponse(token=token, name=user["name"], role=user["role"])

# --- STREAMING CHAT ENDPOINT (Groq) ---
@app.post("/chat/stream")
def chat_stream(body: ChatRequest, authorization: Optional[str] = Header(None)):
    email = _email_from_token(authorization)
    session_id = body.session_id or str(uuid4())
    session = chat_sessions_collection.find_one({"session_id": session_id, "owner_email": email})
    if not session:
        session = {
            "session_id": session_id, "owner_email": email,
            "title": body.message[:40], "messages": [],
            "created_at": _now(), "updated_at": _now()
        }
        chat_sessions_collection.insert_one(session)
    title = session["title"]
    if not session["messages"]:
        title = body.message[:40]
    user_msg = {"role": "user", "content": body.message, "created_at": _now()}
    chat_sessions_collection.update_one(
        {"session_id": session_id},
        {"$push": {"messages": user_msg}, "$set": {"updated_at": _now(), "title": title}}
    )
    prompt = _build_prompt(body.message, body.language)

    def event_stream():
        full_answer = ""
        try:
            meta = json.dumps({"type": "meta", "session_id": session_id, "title": title})
            yield f"data: {meta}\n\n"
            if not groq_client:
                raise Exception("GROQ_API_KEY is not configured")
            stream = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2048,
                temperature=0.3,
                stream=True
            )
            for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    full_answer += token
                    data = json.dumps({"type": "token", "content": token})
                    yield f"data: {data}\n\n"
        except Exception as e:
            error_msg = f"I encountered an error while generating the response. Please try again. (Error: {str(e)})"
            full_answer = error_msg
            data = json.dumps({"type": "error", "content": error_msg})
            yield f"data: {data}\n\n"
        assistant_msg = {"role": "assistant", "content": full_answer, "created_at": _now()}
        chat_sessions_collection.update_one(
            {"session_id": session_id},
            {"$push": {"messages": assistant_msg}, "$set": {"updated_at": _now()}}
        )
        done = json.dumps({"type": "done", "session_id": session_id, "title": title, "answer": full_answer})
        yield f"data: {done}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )

# --- NON-STREAMING CHAT (fallback) ---
@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(body: ChatRequest, authorization: Optional[str] = Header(None)):
    email = _email_from_token(authorization)
    session_id = body.session_id or str(uuid4())
    session = chat_sessions_collection.find_one({"session_id": session_id, "owner_email": email})
    if not session:
        session = {
            "session_id": session_id, "owner_email": email,
            "title": body.message[:40], "messages": [],
            "created_at": _now(), "updated_at": _now()
        }
        chat_sessions_collection.insert_one(session)
    answer = _rag_answer(body.message, body.language)
    user_msg = {"role": "user", "content": body.message, "created_at": _now()}
    assistant_msg = {"role": "assistant", "content": answer, "created_at": _now()}
    title = session["title"]
    if not session["messages"]:
        title = body.message[:40]
    updated = chat_sessions_collection.find_one_and_update(
        {"session_id": session_id},
        {"$push": {"messages": {"$each": [user_msg, assistant_msg]}},
         "$set": {"updated_at": _now(), "title": title}},
        return_document=ReturnDocument.AFTER
    )
    return ChatResponse(
        session_id=session_id, title=updated["title"],
        messages=updated["messages"], answer=answer,
        updated_at=updated["updated_at"]
    )

@app.get("/chat/sessions/{session_id}", response_model=ChatSessionDetail)
def get_session(session_id: str, authorization: Optional[str] = Header(None)):
    email = _email_from_token(authorization)
    session = chat_sessions_collection.find_one({"session_id": session_id, "owner_email": email})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatSessionDetail(
        id=session["session_id"], title=session["title"],
        messages=session.get("messages", []), updated_at=session["updated_at"]
    )

@app.get("/chat/sessions", response_model=List[ChatSessionSummary])
def list_sessions(authorization: Optional[str] = Header(None)):
    email = _email_from_token(authorization)
    cursor = chat_sessions_collection.find({"owner_email": email}).sort("updated_at", -1)
    return [ChatSessionSummary(id=d["session_id"], title=d["title"], updated_at=d["updated_at"]) for d in cursor]

@app.delete("/chat/sessions/{session_id}")
def delete_session(session_id: str, authorization: Optional[str] = Header(None)):
    email = _email_from_token(authorization)
    chat_sessions_collection.delete_one({"session_id": session_id, "owner_email": email})
    return {"status": "deleted"}

@app.post("/lawyers/nearby", response_model=List[Lawyer])
def nearby_lawyers(body: NearbyQuery):
    query = {}
    if body.domain and body.domain != "all":
        query["domain"] = body.domain
    candidates = lawyers_collection.find(query)
    results = []
    for doc in candidates:
        distance = _haversine_km(body.latitude, body.longitude, doc["latitude"], doc["longitude"])
        if distance <= body.radius_km:
            results.append(Lawyer(
                id=doc["email"], name=doc["name"], email=doc["email"],
                domain=doc["domain"], latitude=doc["latitude"],
                longitude=doc["longitude"], phone=doc.get("phone")
            ))
    return results

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
