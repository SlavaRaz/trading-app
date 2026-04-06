from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.ai_service import stream_chat_response

router = APIRouter(tags=["AI Chat"])


class OhlcSummary(BaseModel):
    open: float = 0.0
    high: float = 0.0
    low: float = 0.0
    close: float = 0.0
    trend_pct: float | None = None
    avg_volume: int | None = None
    period: str = ""


class ChatRequest(BaseModel):
    symbol: str
    message: str
    patterns: list[dict] = []
    ohlc_summary: OhlcSummary = OhlcSummary()


@router.post("/chat")
def chat(request: ChatRequest):
    generator = stream_chat_response(
        symbol=request.symbol,
        user_message=request.message,
        patterns=request.patterns,
        ohlc_summary=request.ohlc_summary.model_dump(),
    )
    return StreamingResponse(generator, media_type="text/event-stream")
