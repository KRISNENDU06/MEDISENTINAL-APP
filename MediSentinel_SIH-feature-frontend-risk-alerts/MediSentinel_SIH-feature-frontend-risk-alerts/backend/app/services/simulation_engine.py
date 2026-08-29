"""Outbreak Simulation Engine: SEIR & Spatial Diffusion Model."""
from typing import Any

DISEASE_ARCHETYPES = {
    "DENGUE": {
        "id": "DENGUE",
        "name": "Vector-Borne (Dengue / Chikungunya)",
        "defaultR0": 2.4,
        "incubationDays": 5,
        "primaryDrugClass": "Antipyretics / Platelet Enhancers",
        "syndromeLabel": "Acute Febrile & Arthralgia",
        "leadTimeDays": 6,
        "seasonalRisk": "High (Post-Monsoon)",
    },
    "INFLUENZA": {
        "id": "INFLUENZA",
        "name": "Viral Respiratory (Influenza / SARS-like)",
        "defaultR0": 3.1,
        "incubationDays": 3,
        "primaryDrugClass": "Antivirals & Cough/Cold Formulations",
        "syndromeLabel": "Influenza-Like Illness (ILI)",
        "leadTimeDays": 4,
        "seasonalRisk": "Medium (Winter/Transition)",
    },
    "CHOLERA": {
        "id": "CHOLERA",
        "name": "Waterborne (Acute Diarrheal / Cholera)",
        "defaultR0": 2.8,
        "incubationDays": 2,
        "primaryDrugClass": "Oral Rehydration Salts & Anti-diarrheals",
        "syndromeLabel": "Acute Watery Diarrhea (AWD)",
        "leadTimeDays": 2,
        "seasonalRisk": "High (Monsoon Inundation)",
    },
    "PATHOGEN_X": {
        "id": "PATHOGEN_X",
        "name": "Novel Emerging Pathogen X",
        "defaultR0": 3.8,
        "incubationDays": 4,
        "primaryDrugClass": "Broad-Spectrum Therapeutics",
        "syndromeLabel": "Atypical Multi-System Anomaly",
        "leadTimeDays": 5,
        "seasonalRisk": "Uncertain / Continuous Surveillance",
    },
}

INTERVENTIONS = {
    "NONE": {"id": "NONE", "label": "No Active Intervention", "transmissionReduction": 0.0},
    "FOGGING": {"id": "FOGGING", "label": "Vector Fumigation & Larvicide", "transmissionReduction": 0.35},
    "CONTAINMENT": {"id": "CONTAINMENT", "label": "Micro-Containment & Buffer Cordon", "transmissionReduction": 0.65},
    "PROPHYLAXIS": {"id": "PROPHYLAXIS", "label": "Prophylaxis & Targeted Distribution", "transmissionReduction": 0.50},
}


def simulate_outbreak_step(
    step_index: int = 0,
    r0: float = 2.4,
    archetype: str = "DENGUE",
    intervention: str = "NONE",
    neighbor_distance: int = 0,
) -> dict[str, Any]:
    selected_archetype = DISEASE_ARCHETYPES.get(archetype, DISEASE_ARCHETYPES["DENGUE"])
    selected_intervention = INTERVENTIONS.get(intervention, INTERVENTIONS["NONE"])

    effective_rt = max(0.6, r0 * (1.0 - selected_intervention["transmissionReduction"]))
    spatial_attenuation = 0.55 ** neighbor_distance
    growth_factor = ((effective_rt / 1.5) ** max(0, step_index - 1)) * spatial_attenuation

    baseline_med = 1000
    baseline_fever = 280
    weeks = ["W28", "W29", "W30", "W31", "W32", "W33"]

    generated_timeline = []
    for idx, week in enumerate(weeks):
        if idx < step_index:
            generated_timeline.append({
                "week": week,
                "baseline": baseline_med,
                "medicine": round(baseline_med * (0.95 + idx * 0.05)),
                "fever": round(baseline_fever * (0.95 + idx * 0.04)),
                "risk": min(100, round(15 + idx * 4)),
            })
        else:
            surge_step = idx - step_index + 1
            med_surge = round(baseline_med * (1.0 + 0.38 * surge_step * growth_factor))
            fever_surge = round(baseline_fever * (1.0 + 0.32 * surge_step * growth_factor))
            risk_surge = min(96, round(30 + 16 * surge_step * (growth_factor / 1.2)))
            generated_timeline.append({
                "week": week,
                "baseline": baseline_med,
                "medicine": med_surge,
                "fever": fever_surge,
                "risk": risk_surge,
            })

    active_point = generated_timeline[min(step_index, len(generated_timeline) - 1)]

    return {
        "timeline": generated_timeline,
        "activePoint": active_point,
        "effectiveRt": round(effective_rt, 2),
        "archetype": selected_archetype,
        "intervention": selected_intervention,
    }


def simulate_what_if(
    med_spike_pct: float = 25.0,
    fever_spike_pct: float = 20.0,
    clinic_spike_pct: float = 15.0,
    spread_neighbors: int = 1,
    persistence_weeks: int = 2,
    archetype: str = "DENGUE",
    intervention: str = "NONE",
    r0: float | None = None,
) -> dict[str, Any]:
    selected_archetype = DISEASE_ARCHETYPES.get(archetype, DISEASE_ARCHETYPES["DENGUE"])
    selected_intervention = INTERVENTIONS.get(intervention, INTERVENTIONS["NONE"])
    base_r0 = r0 if r0 is not None else selected_archetype["defaultR0"]

    reduction = selected_intervention["transmissionReduction"]
    effective_rt = max(0.5, round(base_r0 * (1.0 - reduction), 2))

    med_score = max(0.0, min(100.0, med_spike_pct * 1.25))
    health_score = max(0.0, min(100.0, ((fever_spike_pct * 0.6) + (clinic_spike_pct * 0.4)) * 1.25))
    persistence_score = max(0.0, min(100.0, (persistence_weeks / 3.0) * 100.0))
    geographic_score = max(0.0, min(100.0, (spread_neighbors / 4.0) * 100.0))

    composite_score = round(
        med_score * 0.30
        + health_score * 0.30
        + persistence_score * 0.20
        + geographic_score * 0.20,
        1,
    )
    risk_score = max(0.0, min(100.0, composite_score))
    risk_level = "HIGH" if risk_score >= 70.0 else "MEDIUM" if risk_score >= 40.0 else "LOW"
    confidence = min(98, round(70 + (risk_score * 0.25)))

    baseline_med = 1000
    baseline_fever = 280
    baseline_clinic = 65

    simulated_med = round(baseline_med * (1.0 + med_spike_pct / 100.0))
    simulated_fever = round(baseline_fever * (1.0 + fever_spike_pct / 100.0))
    simulated_clinic = round(baseline_clinic * (1.0 + clinic_spike_pct / 100.0))

    # Projected timeline
    timeline = []
    weeks = ["W-2", "W-1", "Current", "W+1", "W+2", "W+3"]
    rt_multiplier = effective_rt / 1.8
    for idx, wk in enumerate(weeks):
        factor = 1.0 + ((idx - 2) * 0.18 * rt_multiplier)
        factor = max(0.6, factor)
        timeline.append({
            "week": wk,
            "baseline": baseline_med,
            "medicine": round(simulated_med * factor),
            "fever": round(simulated_fever * factor),
            "clinic": round(simulated_clinic * factor),
            "risk": min(100, max(5, round(risk_score * (factor if idx >= 2 else (0.7 + idx * 0.15))))),
        })

    explanation_parts = []
    if med_spike_pct > 0:
        explanation_parts.append(f"Medicine demand is {med_spike_pct:+.1f}% above baseline")
    if fever_spike_pct > 0:
        explanation_parts.append(f"Fever cases are {fever_spike_pct:+.1f}% elevated")
    if clinic_spike_pct > 0:
        explanation_parts.append(f"Clinic visits are {clinic_spike_pct:+.1f}% elevated")
    if spread_neighbors > 0:
        explanation_parts.append(f"{spread_neighbors} nearby area{'s are' if spread_neighbors > 1 else ' is'} also elevated")
    if persistence_weeks > 1:
        explanation_parts.append(f"Pattern persisted across {persistence_weeks} consecutive weeks")

    explanation = "; ".join(explanation_parts) if explanation_parts else "Signals align with baseline patterns."
    
    if risk_level == "HIGH":
        action = "Dispatch Rapid Response Team (RRT), activate door-to-door fever surveillance, and alert regional hospitals."
    elif risk_level == "MEDIUM":
        action = "Increase community pharmacy stock monitoring, notify ward health officers, and track daily clinics."
    else:
        action = "Continue standard automated syndromic surveillance."

    return {
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "confidence": confidence,
        "effectiveRt": effective_rt,
        "archetype": selected_archetype,
        "intervention": selected_intervention,
        "factorScores": {
            "medicine": round(med_score, 1),
            "healthIndicators": round(health_score, 1),
            "persistence": round(persistence_score, 1),
            "geographicSpread": round(geographic_score, 1),
        },
        "signals": {
            "medicineDemand": {
                "current": simulated_med,
                "baseline": baseline_med,
                "deviation": f"{med_spike_pct:+.1f}%",
            },
            "feverIndicators": {
                "current": simulated_fever,
                "baseline": baseline_fever,
                "deviation": f"{fever_spike_pct:+.1f}%",
            },
            "clinicVisits": {
                "current": simulated_clinic,
                "baseline": baseline_clinic,
                "deviation": f"{clinic_spike_pct:+.1f}%",
            },
            "geographicSpread": {
                "affectedNeighbors": spread_neighbors,
                "totalNeighbors": 4,
                "deviation": f"+{round((spread_neighbors/4)*100)}%",
            },
        },
        "explanation": explanation,
        "recommendedAction": action,
        "timeline": timeline,
    }

