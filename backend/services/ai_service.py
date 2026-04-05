import os
from typing import Generator

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY", ""),
    base_url="https://api.groq.com/openai/v1",
)

_SYSTEM_PROMPT = """You are an expert trading analyst and chart pattern specialist.
You have deep knowledge of technical analysis, chart patterns, risk management, and trading psychology.
When given OHLC data and detected patterns for a symbol, provide clear, actionable analysis.
Keep responses concise (3–5 sentences max unless more detail is asked for).
Always note that trading involves risk and is not financial advice."""


def stream_chat_response(
    symbol: str,
    user_message: str,
    patterns: list[dict],
    ohlc_summary: dict,
) -> Generator[str, None, None]:
    context_parts = [f"Symbol: {symbol}"]

    if ohlc_summary:
        context_parts.append(
            f"Price summary — Open: {ohlc_summary.get('open')}, "
            f"High: {ohlc_summary.get('high')}, "
            f"Low: {ohlc_summary.get('low')}, "
            f"Close: {ohlc_summary.get('close')}"
        )

    if patterns:
        pattern_lines = [
            f"- {p['pattern']}: entry {p.get('entry_price')}, "
            f"target {p.get('target_price')}, SL {p.get('stop_loss')}, "
            f"R/R {p.get('risk_reward_ratio')}, confidence {p.get('confidence')}"
            for p in patterns
        ]
        context_parts.append("Detected patterns:\n" + "\n".join(pattern_lines))

    context = "\n".join(context_parts)
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": f"Chart context:\n{context}\n\nQuestion: {user_message}"},
    ]

    with _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        stream=True,
    ) as stream:
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield f"data: {delta.content}\n\n"

    yield "data: [DONE]\n\n"
