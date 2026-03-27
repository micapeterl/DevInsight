@echo off
echo Starting DevInsight...

start "DevInsight Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"
start "DevInsight Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000