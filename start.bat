@echo off
title AI Job Scraper and Resume Matcher
cd /d "%~dp0"
echo ========================================================
echo   Starting AI Job Scraper and Resume Matcher...
echo   Your browser will open automatically in a moment!
echo ========================================================
echo.
.venv\Scripts\python.exe run.py
pause
