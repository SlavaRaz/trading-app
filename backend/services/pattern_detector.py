import numpy as np
import pandas as pd
from services.market_data_service import fetch_ohlc
from services.risk_calculator import compute_risk_reward


def detect_patterns(symbol: str, period: str = "6mo", interval: str = "1d") -> dict | None:
    raw = fetch_ohlc(symbol, period=period, interval=interval)
    if raw is None:
        return None

    df = pd.DataFrame(raw["candles"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date")

    detected = []
    detected += _detect_double_bottom(df)
    detected += _detect_double_top(df)
    detected += _detect_head_and_shoulders(df)
    detected += _detect_inverse_head_and_shoulders(df)
    detected += _detect_triangles(df)
    detected += _detect_flags(df)
    detected += _detect_cup_and_handle(df)

    for pattern in detected:
        rr = compute_risk_reward(
            entry=pattern["entry_price"],
            target=pattern["target_price"],
            stop_loss=pattern["stop_loss"],
        )
        pattern.update(rr)

    return {"symbol": symbol, "patterns": detected}


# ── helpers ──────────────────────────────────────────────────────────────────


def _linear_regression(x: list[int], y: list[float]) -> tuple[float, float]:
    """Returns (slope, intercept) of a least-squares line fit."""
    coeffs = np.polyfit(x, y, 1)
    return float(coeffs[0]), float(coeffs[1])


def _find_local_minima(series: pd.Series, window: int = 5) -> list[int]:
    minima = []
    for i in range(window, len(series) - window):
        if series.iloc[i] == series.iloc[i - window : i + window + 1].min():
            minima.append(i)
    return minima


def _find_local_maxima(series: pd.Series, window: int = 5) -> list[int]:
    maxima = []
    for i in range(window, len(series) - window):
        if series.iloc[i] == series.iloc[i - window : i + window + 1].max():
            maxima.append(i)
    return maxima


def _tolerance(val_a: float, val_b: float, pct: float = 0.03) -> bool:
    return abs(val_a - val_b) / max(abs(val_a), abs(val_b)) <= pct


# ── pattern detectors ────────────────────────────────────────────────────────


def _detect_double_bottom(df: pd.DataFrame) -> list[dict]:
    results = []
    lows = df["low"]
    minima = _find_local_minima(lows)

    for i in range(len(minima) - 1):
        idx_a, idx_b = minima[i], minima[i + 1]
        if idx_b - idx_a < 5:
            continue
        low_a, low_b = lows.iloc[idx_a], lows.iloc[idx_b]

        if not _tolerance(low_a, low_b):
            continue

        neckline = df["high"].iloc[idx_a:idx_b].max()
        entry = neckline
        height = neckline - min(low_a, low_b)
        target = neckline + height
        stop_loss = min(low_a, low_b) * 0.99
        confidence = round(0.60 + 0.20 * (1 - abs(low_a - low_b) / neckline), 2)

        results.append(
            {
                "pattern": "Double Bottom",
                "entry_price": round(entry, 4),
                "target_price": round(target, 4),
                "stop_loss": round(stop_loss, 4),
                "confidence": confidence,
                "candle_range": [int(idx_a), int(idx_b)],
            }
        )
    return results


def _detect_double_top(df: pd.DataFrame) -> list[dict]:
    results = []
    highs = df["high"]
    maxima = _find_local_maxima(highs)

    for i in range(len(maxima) - 1):
        idx_a, idx_b = maxima[i], maxima[i + 1]
        if idx_b - idx_a < 5:
            continue
        high_a, high_b = highs.iloc[idx_a], highs.iloc[idx_b]

        if not _tolerance(high_a, high_b):
            continue

        neckline = df["low"].iloc[idx_a:idx_b].min()
        entry = neckline
        height = max(high_a, high_b) - neckline
        target = neckline - height
        stop_loss = max(high_a, high_b) * 1.01
        confidence = round(0.60 + 0.20 * (1 - abs(high_a - high_b) / neckline), 2)

        results.append(
            {
                "pattern": "Double Top",
                "entry_price": round(entry, 4),
                "target_price": round(target, 4),
                "stop_loss": round(stop_loss, 4),
                "confidence": confidence,
                "candle_range": [int(idx_a), int(idx_b)],
            }
        )
    return results


def _detect_head_and_shoulders(df: pd.DataFrame) -> list[dict]:
    results = []
    highs = df["high"]
    lows = df["low"]
    maxima = _find_local_maxima(highs, window=3)

    for i in range(len(maxima) - 2):
        l_idx, h_idx, r_idx = maxima[i], maxima[i + 1], maxima[i + 2]
        left, head, right = highs.iloc[l_idx], highs.iloc[h_idx], highs.iloc[r_idx]

        if not (head > left and head > right):
            continue
        if not _tolerance(left, right, pct=0.05):
            continue

        neckline = (lows.iloc[l_idx:h_idx].min() + lows.iloc[h_idx:r_idx].min()) / 2
        entry = neckline
        height = head - neckline
        target = neckline - height
        stop_loss = head * 1.01
        confidence = round(0.55 + 0.25 * (1 - abs(left - right) / head), 2)

        results.append(
            {
                "pattern": "Head & Shoulders",
                "entry_price": round(entry, 4),
                "target_price": round(target, 4),
                "stop_loss": round(stop_loss, 4),
                "confidence": confidence,
                "candle_range": [int(l_idx), int(r_idx)],
            }
        )
    return results


def _detect_inverse_head_and_shoulders(df: pd.DataFrame) -> list[dict]:
    results = []
    highs = df["high"]
    lows = df["low"]
    minima = _find_local_minima(lows, window=3)

    for i in range(len(minima) - 2):
        l_idx, h_idx, r_idx = minima[i], minima[i + 1], minima[i + 2]
        left, head, right = lows.iloc[l_idx], lows.iloc[h_idx], lows.iloc[r_idx]

        if not (head < left and head < right):
            continue
        if not _tolerance(left, right, pct=0.05):
            continue

        neckline = (highs.iloc[l_idx:h_idx].max() + highs.iloc[h_idx:r_idx].max()) / 2
        entry = neckline
        height = neckline - head
        target = neckline + height
        stop_loss = head * 0.99
        confidence = round(0.55 + 0.25 * (1 - abs(left - right) / neckline), 2)

        results.append(
            {
                "pattern": "Inverse Head & Shoulders",
                "entry_price": round(entry, 4),
                "target_price": round(target, 4),
                "stop_loss": round(stop_loss, 4),
                "confidence": confidence,
                "candle_range": [int(l_idx), int(r_idx)],
            }
        )
    return results


def _detect_triangles(df: pd.DataFrame) -> list[dict]:
    """Detect ascending, descending, and symmetrical triangles using pivot trend lines."""
    results = []
    highs = df["high"]
    lows = df["low"]
    n = len(df)

    if n < 25:
        return results

    lookback = min(60, n)
    start = n - lookback
    seg_highs = highs.iloc[start:]
    seg_lows = lows.iloc[start:]

    maxima = _find_local_maxima(seg_highs, window=4)
    minima = _find_local_minima(seg_lows, window=4)

    if len(maxima) < 3 or len(minima) < 3:
        return results

    high_idxs = maxima[-4:]
    low_idxs = minima[-4:]
    high_vals = [seg_highs.iloc[i] for i in high_idxs]
    low_vals = [seg_lows.iloc[i] for i in low_idxs]

    high_slope, high_intercept = _linear_regression(high_idxs, high_vals)
    low_slope, low_intercept = _linear_regression(low_idxs, low_vals)

    avg_price = (seg_highs.mean() + seg_lows.mean()) / 2
    high_slope_norm = high_slope / avg_price
    low_slope_norm = low_slope / avg_price

    last_x = lookback - 1
    last_high = high_slope * last_x + high_intercept
    last_low = low_slope * last_x + low_intercept

    if last_high <= last_low:
        return results

    flat_threshold = 0.0005
    max_height = max(high_vals) - min(low_vals)

    pattern_type = None
    entry = target = stop_loss = None
    confidence = 0.65

    if abs(high_slope_norm) < flat_threshold and low_slope_norm > flat_threshold:
        pattern_type = "Ascending Triangle"
        entry = last_high
        target = entry + max_height
        stop_loss = seg_lows.iloc[low_idxs[-1]] * 0.99
        confidence = round(min(0.85, 0.60 + 0.05 * len(minima)), 2)

    elif high_slope_norm < -flat_threshold and abs(low_slope_norm) < flat_threshold:
        pattern_type = "Descending Triangle"
        entry = last_low
        target = entry - max_height
        stop_loss = seg_highs.iloc[high_idxs[-1]] * 1.01
        confidence = round(min(0.85, 0.60 + 0.05 * len(maxima)), 2)

    elif high_slope_norm < -flat_threshold and low_slope_norm > flat_threshold:
        pattern_type = "Symmetrical Triangle"
        entry = last_high
        target = entry + max_height * 0.8
        stop_loss = last_low * 0.99
        confidence = round(min(0.80, 0.55 + 0.05 * min(len(maxima), len(minima))), 2)

    if pattern_type:
        results.append(
            {
                "pattern": pattern_type,
                "entry_price": round(entry, 4),
                "target_price": round(target, 4),
                "stop_loss": round(stop_loss, 4),
                "confidence": confidence,
                "candle_range": [int(start), int(n - 1)],
            }
        )

    return results


def _detect_flags(df: pd.DataFrame) -> list[dict]:
    """Detect bull and bear flags (strong pole followed by counter-channel consolidation)."""
    results = []
    closes = df["close"]
    highs = df["high"]
    lows = df["low"]
    n = len(df)

    if n < 15:
        return results

    for pole_len in range(5, 15):
        for flag_len in range(5, 15):
            total = pole_len + flag_len
            if total > n:
                continue

            pole_start = n - total
            pole_end = pole_start + pole_len

            pole_open = closes.iloc[pole_start]
            pole_close = closes.iloc[pole_end - 1]
            pole_move_pct = (pole_close - pole_open) / pole_open

            if abs(pole_move_pct) < 0.05:
                continue

            pole_height = abs(pole_close - pole_open)
            flag_closes = closes.iloc[pole_end:]
            flag_highs = highs.iloc[pole_end:]
            flag_lows = lows.iloc[pole_end:]
            flag_range = flag_highs.max() - flag_lows.min()

            if flag_range > pole_height * 0.5:
                continue

            flag_slope, _ = _linear_regression(
                list(range(len(flag_closes))), flag_closes.tolist()
            )

            if pole_move_pct > 0 and flag_slope < 0:
                entry = flag_highs.max()
                results.append(
                    {
                        "pattern": "Bull Flag",
                        "entry_price": round(entry, 4),
                        "target_price": round(entry + pole_height, 4),
                        "stop_loss": round(flag_lows.min() * 0.99, 4),
                        "confidence": round(min(0.85, 0.60 + min(pole_move_pct, 0.20)), 2),
                        "candle_range": [int(pole_start), int(n - 1)],
                    }
                )
                return results

            if pole_move_pct < 0 and flag_slope > 0:
                entry = flag_lows.min()
                results.append(
                    {
                        "pattern": "Bear Flag",
                        "entry_price": round(entry, 4),
                        "target_price": round(entry - pole_height, 4),
                        "stop_loss": round(flag_highs.max() * 1.01, 4),
                        "confidence": round(min(0.85, 0.60 + min(abs(pole_move_pct), 0.20)), 2),
                        "candle_range": [int(pole_start), int(n - 1)],
                    }
                )
                return results

    return results


def _detect_cup_and_handle(df: pd.DataFrame) -> list[dict]:
    """Detect cup and handle: rounded U-bottom followed by a small handle pullback."""
    results = []
    closes = df["close"]
    highs = df["high"]
    lows = df["low"]
    n = len(df)

    if n < 40:
        return results

    for cup_len in [50, 40, 30]:
        for handle_len in [10, 7, 5]:
            total = cup_len + handle_len
            if total > n:
                continue

            cup_start = n - total
            cup_end = cup_start + cup_len

            cup_closes = closes.iloc[cup_start:cup_end]
            cup_lows = lows.iloc[cup_start:cup_end]

            handle_highs = highs.iloc[cup_end:]
            handle_lows = lows.iloc[cup_end:]

            left_rim = cup_closes.iloc[:5].mean()
            right_rim = cup_closes.iloc[-5:].mean()
            cup_bottom = cup_lows.min()
            rim_avg = (left_rim + right_rim) / 2
            cup_depth = rim_avg - cup_bottom

            if cup_depth <= 0:
                continue
            if not _tolerance(left_rim, right_rim, pct=0.05):
                continue

            depth_pct = cup_depth / rim_avg
            if not 0.05 <= depth_pct <= 0.40:
                continue

            # Bottom should sit in the middle third of the cup
            bottom_idx = int(cup_lows.argmin())
            if not cup_len // 3 <= bottom_idx <= 2 * cup_len // 3:
                continue

            handle_drop = right_rim - handle_lows.min()
            if handle_drop > cup_depth * 0.5 or handle_lows.min() < cup_bottom:
                continue

            entry = right_rim
            results.append(
                {
                    "pattern": "Cup & Handle",
                    "entry_price": round(entry, 4),
                    "target_price": round(entry + cup_depth, 4),
                    "stop_loss": round(handle_lows.min() * 0.99, 4),
                    "confidence": round(min(0.85, 0.60 + (1 - depth_pct) * 0.20), 2),
                    "candle_range": [int(cup_start), int(n - 1)],
                }
            )
            return results

    return results
