"""Differential Privacy API Router."""
from typing import Annotated, Any
from fastapi import APIRouter, Body

from app.services.differential_privacy import apply_differential_privacy

router = APIRouter(prefix="/privacy", tags=["privacy"])


@router.post("/perturb")
def perturb_signals(payload: Annotated[dict[str, Any], Body()] = None) -> dict[str, Any]:
    payload = payload or {}
    data = payload.get("data", [])
    epsilon = float(payload.get("epsilon", 1.0))
    sensitivity = float(payload.get("sensitivity", 1.0))

    return apply_differential_privacy(data=data, epsilon=epsilon, sensitivity=sensitivity)

