"""Federated community-health node simulation and privacy-preserving aggregation.

This module provides a hackathon-ready federated processing layer: each node
computes local aggregates, applies the existing differential-privacy mechanism,
and sends only privacy-preserving signals to the central risk engine.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from threading import Lock
from typing import Any

from app.services.differential_privacy import apply_differential_privacy


NODE_CATALOG: list[dict[str, Any]] = [
    {"node_id": "NODE-001", "name": "SCB Medical Node", "type": "Hospital", "location": "Cuttack", "status": "CONNECTED"},
    {"node_id": "NODE-002", "name": "Campus Clinic Node", "type": "Campus Clinic", "location": "Bhubaneswar", "status": "CONNECTED"},
    {"node_id": "NODE-003", "name": "District Clinic Node", "type": "Community Clinic", "location": "Puri", "status": "CONNECTED"},
    {"node_id": "NODE-004", "name": "Water & Environment Node", "type": "Environmental", "location": "Khordha", "status": "CONNECTED"},
]

_state_lock = Lock()
_last_sync: dict[str, dict[str, Any]] = {}


def node_status() -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc).isoformat()
    with _state_lock:
        return [
            {
                **node,
                "last_sync": _last_sync.get(node["node_id"], {}).get("last_sync", now),
                "signals_sent": _last_sync.get(node["node_id"], {}).get("signals_sent", 0),
                "raw_records_shared": 0,
                "privacy": "DIFFERENTIAL_PRIVACY",
            }
            for node in NODE_CATALOG
        ]


def process_local_node(node_id: str, area_name: str, observed_on: date, signals: dict[str, float], epsilon: float = 2.0) -> dict[str, Any]:
    """Process a node's local aggregate and return only safe outputs.

    In production, this function runs inside the participating institution's
    node service. The central server receives only noisy aggregate values.
    """
    known = next((n for n in NODE_CATALOG if n["node_id"] == node_id), None)
    if not known:
        raise ValueError("Unknown federated node")

    local_points = [
        {"signal_type": signal, "value": max(0.0, float(value))}
        for signal, value in signals.items()
    ]
    protected = apply_differential_privacy(local_points, epsilon=epsilon, sensitivity=1.0)

    safe_signals = [
        {
            "signal_type": point["signal_type"],
            "noisy_value": point["noisyCount"],
            "epsilon": point["epsilon"],
        }
        for point in protected["data"]
    ]
    sync = datetime.now(timezone.utc).isoformat()
    with _state_lock:
        _last_sync[node_id] = {"last_sync": sync, "signals_sent": len(safe_signals)}

    return {
        "node_id": node_id,
        "node_name": known["name"],
        "area_name": area_name,
        "observed_on": observed_on.isoformat(),
        "privacy": "DIFFERENTIAL_PRIVACY",
        "raw_records_shared": 0,
        "signals": safe_signals,
        "synced_at": sync,
    }


def simulate_federated_round(observed_on: date) -> dict[str, Any]:
    """Run one deterministic demo round across three independent local nodes."""
    local_inputs = [
        ("NODE-001", "Cuttack", {"fever_cases": 54, "clinic_visits": 68, "medicine_demand": 47}),
        ("NODE-002", "Bhubaneswar", {"fever_cases": 39, "clinic_visits": 51, "medicine_demand": 42}),
        ("NODE-003", "Puri", {"fever_cases": 31, "clinic_visits": 44, "medicine_demand": 36}),
    ]
    results = [process_local_node(node, area, observed_on, signals) for node, area, signals in local_inputs]
    return {
        "round_id": datetime.now(timezone.utc).strftime("FED-%Y%m%d-%H%M%S"),
        "nodes_processed": len(results),
        "raw_records_shared": 0,
        "privacy": "DIFFERENTIAL_PRIVACY",
        "architecture": "LOCAL_PROCESSING -> PRIVACY -> AGGREGATED SIGNALS -> CENTRAL RISK ENGINE",
        "nodes": results,
    }
