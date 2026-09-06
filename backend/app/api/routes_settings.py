import os
from fastapi import APIRouter
from app.core.database import get_setting, set_setting
from app.models.schemas import SettingsPayload

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_settings():
    db_key = get_setting("gemini_api_key", "")
    env_key = os.getenv("GEMINI_API_KEY", "")
    active_key = db_key or env_key
    model = get_setting("gemini_model", os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))

    masked_key = ""
    if active_key:
        if len(active_key) > 8:
            masked_key = f"{active_key[:4]}...{active_key[-4:]}"
        else:
            masked_key = "****"

    return {
        "has_api_key": bool(active_key),
        "masked_api_key": masked_key,
        "model": model,
        "source": "database" if db_key else ("environment" if env_key else "none")
    }

@router.post("")
def update_settings(payload: SettingsPayload):
    if payload.gemini_api_key is not None:
        set_setting("gemini_api_key", payload.gemini_api_key.strip())
    if payload.gemini_model:
        set_setting("gemini_model", payload.gemini_model.strip())

    return {"status": "success", "message": "Settings updated successfully."}

@router.post("/test-key")
def test_gemini_key(payload: SettingsPayload):
    test_key = payload.gemini_api_key
    if not test_key:
        test_key = get_setting("gemini_api_key") or os.getenv("GEMINI_API_KEY")

    if not test_key:
        return {"success": False, "message": "No API key provided or configured."}

    try:
        from google import genai
        client = genai.Client(api_key=test_key)
        model = payload.gemini_model or get_setting("gemini_model", "gemini-2.5-flash")
        response = client.models.generate_content(
            model=model,
            contents="Say 'Gemini API is connected successfully!' in 6 words or less."
        )
        return {
            "success": True,
            "message": response.text.strip()
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Connection failed: {str(e)}"
        }
