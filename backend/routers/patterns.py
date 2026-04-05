from fastapi import APIRouter, HTTPException, Query
from services.pattern_detector import detect_patterns

router = APIRouter(tags=["Patterns"])


@router.get("/patterns/{symbol}")
def get_patterns(
    symbol: str,
    period: str = Query(default="6mo"),
    interval: str = Query(default="1d"),
):
    result = detect_patterns(symbol.upper(), period=period, interval=interval)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No data found for symbol '{symbol}'")
    return result
