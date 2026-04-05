from __future__ import annotations

import logging

import yfinance as yf
from pydantic import BaseModel

logger = logging.getLogger(__name__)

VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}
VALID_INTERVALS = {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"}


class Candle(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class OhlcResponse(BaseModel):
    symbol: str
    name: str
    period: str
    interval: str
    currency: str
    candles: list[Candle]


def fetch_ohlc(symbol: str, period: str = "3mo", interval: str = "1d") -> OhlcResponse | None:
    """Fetch OHLC candle data for a symbol from Yahoo Finance.

    Returns None when no data is available for the given symbol/period/interval.
    Raises ValueError for unsupported period or interval values.
    """
    if period not in VALID_PERIODS:
        raise ValueError(f"Invalid period '{period}'. Valid values: {sorted(VALID_PERIODS)}")
    if interval not in VALID_INTERVALS:
        raise ValueError(f"Invalid interval '{interval}'. Valid values: {sorted(VALID_INTERVALS)}")

    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
    except Exception as exc:
        logger.error("yfinance error fetching %s: %s", symbol, exc)
        return None

    if df.empty:
        return None

    df = df.reset_index()
    date_col = "Datetime" if "Datetime" in df.columns else "Date"

    candles = [
        Candle(
            date=row[date_col].isoformat(),
            open=round(row["Open"], 4),
            high=round(row["High"], 4),
            low=round(row["Low"], 4),
            close=round(row["Close"], 4),
            volume=int(row["Volume"]),
        )
        for row in df[["Open", "High", "Low", "Close", "Volume", date_col]].to_dict("records")
    ]

    info = ticker.fast_info
    currency = getattr(info, "currency", "USD") or "USD"
    name = getattr(ticker, "info", {}).get("shortName", symbol)

    return OhlcResponse(
        symbol=symbol,
        name=name,
        period=period,
        interval=interval,
        currency=currency,
        candles=candles,
    )
