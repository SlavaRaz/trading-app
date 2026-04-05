from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import market_data, patterns, ai_chat

app = FastAPI(
    title="Trading Pattern Detection API",
    description="AI-powered pattern detection for stocks and crypto",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_data.router, prefix="/api")
app.include_router(patterns.router, prefix="/api")
app.include_router(ai_chat.router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}
