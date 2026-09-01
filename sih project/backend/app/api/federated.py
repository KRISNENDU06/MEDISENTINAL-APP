from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import require_roles
from app.models.domain import Role, User
from app.services.federated import node_status, process_local_node, simulate_federated_round

router = APIRouter(prefix="/federated", tags=["federated"])


class FederatedSignalRequest(BaseModel):
    node_id: str = Field(min_length=1, max_length=64)
    area_name: str = Field(min_length=1, max_length=120)
    observed_on: date
    signals: dict[str, float]
    epsilon: float = Field(default=2.0, gt=0)


@router.get("/nodes")
def get_nodes(
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
) -> dict[str, Any]:
    nodes = node_status()
    return {
        "nodes": nodes,
        "total_nodes": len(nodes),
        "connected_nodes": sum(n["status"] == "CONNECTED" for n in nodes),
        "raw_records_shared": 0,
        "privacy_enabled": True,
    }


@router.post("/process-local")
def process_local(
    payload: FederatedSignalRequest,
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
) -> dict[str, Any]:
    try:
        return process_local_node(
            node_id=payload.node_id,
            area_name=payload.area_name,
            observed_on=payload.observed_on,
            signals=payload.signals,
            epsilon=payload.epsilon,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/simulate-round")
def simulate_round(
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
    observed_on: date | None = None,
) -> dict[str, Any]:
    return simulate_federated_round(observed_on or date.today())
