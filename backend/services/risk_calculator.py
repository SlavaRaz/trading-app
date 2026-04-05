from pydantic import BaseModel


class RiskRewardResult(BaseModel):
    direction: str
    risk_reward_ratio: float
    rr_label: str
    potential_gain_pct: float
    potential_loss_pct: float
    rr_rating: str


def compute_risk_reward(entry: float, target: float, stop_loss: float) -> dict:
    """
    Compute risk/reward metrics for a trade setup.

    Direction is inferred from the position of target vs stop_loss relative to entry:
    - Long:  target > entry > stop_loss
    - Short: target < entry < stop_loss

    Returns a dict compatible with RiskRewardResult.
    """
    reward = abs(target - entry)
    risk = abs(entry - stop_loss)

    direction = "long" if target > entry else "short"

    if risk == 0:
        ratio = 0.0
        gain_pct = 0.0
        loss_pct = 0.0
    else:
        ratio = round(reward / risk, 2)
        gain_pct = round(reward / entry * 100, 2) if entry > 0 else 0.0
        loss_pct = round(risk / entry * 100, 2) if entry > 0 else 0.0

    rr_label = f"1:{ratio}" if ratio > 0 else "N/A"

    if ratio >= 2:
        rr_rating = "good"
    elif ratio >= 1:
        rr_rating = "fair"
    else:
        rr_rating = "poor"

    return RiskRewardResult(
        direction=direction,
        risk_reward_ratio=ratio,
        rr_label=rr_label,
        potential_gain_pct=gain_pct,
        potential_loss_pct=loss_pct,
        rr_rating=rr_rating,
    ).model_dump()
