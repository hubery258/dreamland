# MyBlog (React frontend + FastAPI backend)

This repository contains a minimal React (Vite) frontend and a FastAPI backend.

Run the backend:

```powershell
cd myblog\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Run the frontend:

```powershell
cd myblog\frontend
npm install
npm run dev
```

Notes:
- The frontend expects the API at `http://localhost:8000` during development.
- I will not introduce TypeScript unless you ask — confirm if you want it.
