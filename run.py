#!/usr/bin/env python3
"""
AI Job Scraper & Resume Matcher Launcher
Launches the FastAPI backend and provides unified full-stack serving.
"""
import sys
import io
import os
import argparse
import subprocess
import webbrowser
from pathlib import Path

# Fix Windows console encoding for characters
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
except Exception:
    pass

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"
VENV_DIR = ROOT_DIR / ".venv"

def get_python_exe():
    if sys.platform == "win32":
        venv_py = VENV_DIR / "Scripts" / "python.exe"
    else:
        venv_py = VENV_DIR / "bin" / "python"
    return str(venv_py) if venv_py.exists() else sys.executable

def main():
    parser = argparse.ArgumentParser(description="AI Job Scraper & Resume Matcher Launcher")
    parser.add_argument("--host", default="127.0.0.1", help="Host address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Backend port (default: 8000)")
    parser.add_argument("--dev", action="store_true", help="Run both FastAPI backend and Vite dev server concurrently")
    parser.add_argument("--open", dest="open", action="store_true", default=True, help="Open browser on start")
    parser.add_argument("--no-open", dest="open", action="store_false", help="Do not open browser automatically")
    args = parser.parse_args()

    # Ensure backend directory is in PYTHONPATH
    os.environ["PYTHONPATH"] = str(BACKEND_DIR)

    python_exe = get_python_exe()

    if args.dev:
        print("[DEV MODE] Starting FastAPI and Vite dev server...")
        vite_cmd = "npm run dev"
        vite_proc = subprocess.Popen(vite_cmd, cwd=str(FRONTEND_DIR), shell=True)

        uvicorn_cmd = [
            python_exe, "-m", "uvicorn", "app.main:app",
            "--host", args.host, "--port", str(args.port), "--reload"
        ]
        backend_proc = subprocess.Popen(uvicorn_cmd, cwd=str(BACKEND_DIR))

        print(f"\n[INFO] Backend API: http://{args.host}:{args.port}")
        print(f"[INFO] Frontend UI: http://localhost:5173\n")

        if args.open:
            webbrowser.open("http://localhost:5173")

        try:
            backend_proc.wait()
        except KeyboardInterrupt:
            print("\nShutting down servers...")
            backend_proc.terminate()
            vite_proc.terminate()
    else:
        print("[INFO] Starting AI Job Scraper & Resume Matcher...")
        url = f"http://{args.host}:{args.port}"
        print(f"[INFO] Unified Application: {url}")
        print(f"[INFO] Interactive API docs: {url}/docs\n")

        if args.open:
            webbrowser.open(url)

        # Run FastAPI via uvicorn
        import uvicorn
        sys.path.insert(0, str(BACKEND_DIR))
        from app.main import app
        uvicorn.run(app, host=args.host, port=args.port)

if __name__ == "__main__":
    main()
