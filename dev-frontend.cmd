@echo off
cd /d "%~dp0"
set VITE_API_URL=http://localhost:5000/api
npm run dev -- --host 0.0.0.0 > "%~dp0catas-frontend.log" 2>&1
