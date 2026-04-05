# Trading App — Python FastAPI Backend

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

copy .env.example .env
# Edit .env and set OPENAI_API_KEY
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/ohlc/{symbol}` | OHLC candlestick data |
| GET | `/api/patterns/{symbol}` | Detected chart patterns with entry/target/SL |
| POST | `/api/chat` | AI chat assistant (SSE streaming) |

### Query Parameters — `/api/ohlc/{symbol}`

| Param | Default | Options |
|-------|---------|---------|
| `period` | `3mo` | `1mo`, `3mo`, `6mo`, `1y` |
| `interval` | `1d` | `1d`, `1wk`, `1mo` |

### POST `/api/chat` Body

```json
{
  "symbol": "AAPL",
  "message": "Is this a good entry?",
  "patterns": [],
  "ohlc_summary": { "open": 175, "high": 180, "low": 173, "close": 178 }
}
```

## Project Structure

```
backend/
├── main.py                    # FastAPI app, CORS, router registration
├── requirements.txt
├── .env.example
├── routers/
│   ├── market_data.py         # GET /api/ohlc/{symbol}
│   ├── patterns.py            # GET /api/patterns/{symbol}
│   └── ai_chat.py             # POST /api/chat (SSE)
└── services/
    ├── market_data_service.py # yfinance wrapper
    ├── pattern_detector.py    # Double Top/Bottom, H&S, Inverse H&S
    ├── risk_calculator.py     # R/R ratio, gain/loss %
    └── ai_service.py          # GPT-4o streaming chat
```
