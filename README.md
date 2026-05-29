# NyaySathi | AI-Powered Legal Assistant

This project is an AI-powered legal assistant focused on the Indian Code of Criminal Procedure (CrPC), featuring a Next.js frontend and a FastAPI/MongoDB/ChromaDB backend.

## 🚀 How to get this on GitHub

Since I cannot push directly to your account, follow these steps to upload your code:

1. **Download Project**: Click the "Download Project" button in the top-right of your workspace to get the ZIP.
2. **Initialize Git**: Open your terminal in the extracted folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Legal Assistant"
   ```
3. **Create Repository on GitHub**: 
   - Go to [GitHub](https://github.com/new) and create a new repository named `nyaysathi`.
   - Do **not** initialize it with a README or License.
4. **Push to GitHub**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nyaysathi.git
   git push -u origin main
   ```

## 🛠️ Local Setup Instructions

### 1. MongoDB
Download and install [MongoDB Community Edition](https://www.mongodb.com/try/download/community). Ensure the service is running on `localhost:27017`.

### 2. Ollama
Install [Ollama](https://ollama.com/) and download the Llama 3 model:
```bash
ollama pull llama3
```

### 3. Backend Setup
Navigate to the root folder and install dependencies:
```bash
pip install fastapi uvicorn pymongo chromadb ollama deep-translator gTTS
```
Place your `chroma_db` folder in the root directory.
Run the backend:
```bash
python backend/main.py
```

### 4. Frontend Setup
Install Node dependencies:
```bash
npm install
```
Run the development server:
```bash
npm run dev
```

## 📂 Project Structure
- `/backend`: FastAPI server, MongoDB logic, and RAG (ChromaDB) implementation.
- `/src/app`: Next.js frontend pages.
- `/src/context`: React Context for Auth, Chat, and Language support.

## ⚖️ Features
- **RAG-based Chat**: Powered by `llama3` and your legal vector database.
- **Multilingual**: Supports English, Hindi, and Marathi.
- **Voice Output**: Integrated text-to-speech for legal advice.
- **Lawyer Search**: Find legal experts within a 25km radius.
