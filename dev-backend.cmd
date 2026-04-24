@echo off
cd /d "%~dp0backEnd"
set MONGODB_DB=catas
npm run dev > "%~dp0catas-backend.log" 2>&1
