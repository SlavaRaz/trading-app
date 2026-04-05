def compute_risk_reward(entry: float, target: float, stop_loss: float) -> dict:
    reward = abs(target - entry)
    risk = abs(entry - stop_loss)

    ratio = round(reward / risk, 2) if risk > 0 else 0.0
    gain_pct = round((reward / entry) * 100, 2) if entry > 0 else 0.0
    loss_pct = round((risk / entry) * 100, 2) if entry > 0 else 0.0

    if ratio >= 2:
        rating = "good"
    elif ratio >= 1:
        rating = "fair"
    else:
        rating = "poor"

    return {
        "risk_reward_ratio": ratio,
        "potential_gain_pct": gain_pct,
        "potential_loss_pct": loss_pct,
        "rr_rating": rating,
    }
