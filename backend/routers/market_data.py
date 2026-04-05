from fastapi import APIRouter, HTTPException, Query
from services.market_data_service import OhlcResponse, fetch_ohlc

router = APIRouter(tags=["Market Data"])

PERIOD_DESCRIPTION = "Data period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max"
INTERVAL_DESCRIPTION = "Bar interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo"


@router.get("/ohlc/{symbol}", response_model=OhlcResponse)
def get_ohlc(
    symbol: str,
    period: str = Query(default="3mo", description=PERIOD_DESCRIPTION),
    interval: str = Query(default="1d", description=INTERVAL_DESCRIPTION),
):
    """Return OHLC candlestick data for a given symbol."""
    try:
        data = fetch_ohlc(symbol.upper(), period=period, interval=interval)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if data is None:
        raise HTTPException(status_code=404, detail=f"No data found for symbol '{symbol}'")

    return data
