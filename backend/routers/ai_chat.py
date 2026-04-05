from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.ai_service import stream_chat_response

router = APIRouter(tags=["AI Chat"])


class ChatRequest(BaseModel):
    symbol: str
    message: str
    patterns: list[dict] = []
    ohlc_summary: dict = {}


@router.post("/chat")
def chat(request: ChatRequest):
    generator = stream_chat_response(
        symbol=request.symbol,
        user_message=request.message,
        patterns=request.patterns,
        ohlc_summary=request.ohlc_summary,
    )
    return StreamingResponse(generator, media_type="text/event-stream")
