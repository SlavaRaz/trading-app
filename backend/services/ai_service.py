import os
from typing import Generator

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY", ""),
    base_url="https://api.groq.com/openai/v1",
)

_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

_SYSTEM_PROMPT = """You are an expert trading analyst and chart pattern specialist.
You have deep knowledge of technical analysis, chart patterns, risk management, and trading psychology.
When given OHLC data and detected patterns for a symbol, provide clear, actionable analysis.
Keep responses concise (3–5 sentences max unless more detail is asked for).
Reference specific price levels (entry, target, stop-loss) from the chart context when relevant.
Always note that trading involves risk and is not financial advice."""


def _build_chart_context(symbol: str, ohlc_summary: dict, patterns: list[dict]) -> str:
    parts = [f"Symbol: {symbol}"]

    if ohlc_summary:
        trend_pct = ohlc_summary.get("trend_pct")
        trend_str = f"{trend_pct:+.2f}% over period" if trend_pct is not None else "N/A"
        avg_vol = ohlc_summary.get("avg_volume")
        vol_str = f"{avg_vol:,}" if avg_vol else "N/A"
        period = ohlc_summary.get("period", "")

        parts.append(
            f"Price summary{f' ({period})' if period else ''} — "
            f"Close: {ohlc_summary.get('close')}, "
            f"High: {ohlc_summary.get('high')}, "
            f"Low: {ohlc_summary.get('low')}, "
            f"Open: {ohlc_summary.get('open')}, "
            f"Trend: {trend_str}, "
            f"Avg volume: {vol_str}"
        )

    if patterns:
        pattern_lines = [
            f"- {p['pattern']} ({p.get('direction', '')}) "
            f"entry {p.get('entry_price')}, "
            f"target {p.get('target_price')}, SL {p.get('stop_loss')}, "
            f"R/R {p.get('rr_label', p.get('risk_reward_ratio'))}, "
            f"confidence {p.get('confidence')}, rating {p.get('rr_rating')}"
            for p in patterns
        ]
        parts.append("Detected patterns:\n" + "\n".join(pattern_lines))
    else:
        parts.append("No patterns detected for this period.")

    return "\n".join(parts)


def stream_chat_response(
    symbol: str,
    user_message: str,
    patterns: list[dict],
    ohlc_summary: dict,
    history: list[dict] | None = None,
) -> Generator[str, None, None]:
    chart_context = _build_chart_context(symbol, ohlc_summary, patterns)

    # Embed chart context in the system prompt so it persists across all turns
    system_with_context = (
        f"{_SYSTEM_PROMPT}\n\n"
        f"## Current chart context (always reference this):\n{chart_context}"
    )

    messages: list[dict] = [{"role": "system", "content": system_with_context}]

    # Inject prior conversation turns for multi-turn support
    if history:
        for turn in history:
            role = turn.get("role", "")
            content = turn.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    try:
        with _client.chat.completions.create(
            model=_MODEL,
            messages=messages,
            stream=True,
            max_tokens=1024,
            temperature=0.3,
        ) as stream:
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield f"data: {delta.content}\n\n"
    except Exception as exc:
        yield f"data: [ERROR] {exc}\n\n"

    yield "data: [DONE]\n\n"
