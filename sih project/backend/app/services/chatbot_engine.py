"""MEDISENTINEL AI Health & Epidemiological Conversational Assistant.
Provides comprehensive clinical guidelines, outbreak prevention protocols,
Standard Operating Procedures (SOPs), medical queries, and app tutorials.
"""
from datetime import datetime, timezone
import re
from typing import Any


def process_chat_message(
    message: str,
    conversation_history: list[dict[str, str]] | None = None,
    areas_data: list[dict[str, Any]] | None = None,
    selected_area_id: str | None = None,
) -> dict[str, Any]:
    """Process user message and generate a medically grounded, context-aware answer."""
    query = (message or "").strip().lower()
    query_norm = query.replace("-", " ")
    areas_data = areas_data or []
    now_iso = datetime.now(timezone.utc).isoformat()

    # Find context area if user mentions one or if selected
    matched_area = None
    for a in areas_data:
        area_name_lower = a.get("name", "").lower()
        district_lower = a.get("district", "").lower()
        if (
            area_name_lower in query
            or any(part in query for part in area_name_lower.split() if len(part) > 3)
            or (district_lower and district_lower in query)
        ):
            matched_area = a
            break

    if not matched_area and selected_area_id:
        matched_area = next((a for a in areas_data if a.get("id") == selected_area_id), None)
    if not matched_area and areas_data:
        # Default to highest risk area if asking about outbreak
        if any(term in query for term in ["outbreak", "highest", "risk", "spike", "problem", "warning"]):
            matched_area = max(areas_data, key=lambda x: x.get("riskScore", 0), default=areas_data[0])

    # -------------------------------------------------------------
    # 1. GREETINGS & INTRODUCTIONS
    # -------------------------------------------------------------
    if any(q == query or query.startswith(q) for q in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "help"]):
        return {
            "response": (
                "👋 **Namaste! I am the MEDISENTINEL AI Health & Epidemiological Assistant.**\n\n"
                "I am equipped to help you with:\n"
                "• **Disease Outbreak & Prevention**: Dengue, Cholera, Influenza, Malaria & waterborne illnesses.\n"
                "• **Public Health SOPs**: Emergency response workflows, ward-level containment & disinfection protocols.\n"
                "• **Medical Guidelines**: Fever triage, hydration management, symptom escalation warnings.\n"
                "• **MEDISENTINEL Platform**: 4-pillar risk formula, real-world map, what-if simulator & data ingestion.\n\n"
                "How can I assist your surveillance or public health response today?"
            ),
            "category": "GREETING",
            "suggested_questions": [
                "Why is Saheed Nagar at High Risk?",
                "What is the Dengue Outbreak Prevention SOP?",
                "How is the 4-Pillar Risk Score calculated?",
            ],
            "related_actions": ["VIEW_MAP", "RUN_RISK_ENGINE"],
            "timestamp": now_iso,
        }

    # -------------------------------------------------------------
    # 2. APP SPECIFIC: RISK FORMULA & WEIGHTING
    # -------------------------------------------------------------
    if any(
        term in query or term in query_norm
        for term in [
            "how risk is calculated",
            "risk formula",
            "4 pillar",
            "four pillar",
            "weights",
            "weighting",
            "how is risk calculated",
            "how risk score",
            "calculation",
            "calculate risk",
            "risk score work",
            "pillar",
            "formula",
        ]
    ):
        return {
            "response": (
                "🧮 **MEDISENTINEL 4-Pillar Composite Risk Calculation Engine**\n\n"
                "The platform calculates an explainable risk index ($0 - 100$) by cross-validating 4 independent telemetry channels:\n\n"
                "1. **Pharmacy Medicine Demand (30% Weight)**:\n"
                "   • Tracks OTC antipyretics, analgesics, and antibiotics sales.\n"
                "   • Compares the 7-day moving volume against the 90-day seasonal baseline.\n"
                "   • *Important Principle*: Medicine demand is an early supporting signal, not definitive proof on its own.\n\n"
                "2. **Syndromic Health Indicators (30% Weight)**:\n"
                "   • Ingests fever logs, respiratory (ILI) counts, and outpatient clinic footfall.\n"
                "   • Cross-validates pharmaceutical surges with actual clinical admissions.\n\n"
                "3. **Temporal Persistence (20% Weight)**:\n"
                "   • Evaluates whether anomalies persist for 1, 2, or 3+ consecutive weekly cycles.\n"
                "   • Filters out one-day artificial inventory spikes.\n\n"
                "4. **Geographic Spread & Contagion (20% Weight)**:\n"
                "   • Measures if neighboring connected wards also exhibit simultaneous anomalies.\n\n"
                "**Risk Thresholds**:\n"
                "• `0 - 39` : 🟢 **LOW RISK** (Standard Routine Monitoring)\n"
                "• `40 - 69`: 🟡 **MEDIUM RISK** (Enhanced Surveillance & Verification)\n"
                "• `70 - 100`: 🔴 **HIGH RISK** (Early Warning & Rapid Response Team Activation)"
            ),
            "category": "APP_GUIDE",
            "suggested_questions": [
                "What are the Public Health SOPs for High Risk?",
                "How do I run the What-If Simulator?",
                "How do I add a new health signal observation?",
            ],
            "related_actions": ["VIEW_COMPARISON", "RUN_RISK_ENGINE"],
            "timestamp": now_iso,
        }

    # -------------------------------------------------------------
    # 3. APP SPECIFIC: HOW TO USE FEATURES (What-if, Observation, Engine)
    # -------------------------------------------------------------
    if any(term in query for term in ["what if", "simulator", "simulation", "seir"]):
        return {
            "response": (
                "🧪 **How to Use the Interactive What-If Epidemic Simulator**\n\n"
                "The What-If Simulator models disease propagation dynamics using an epidemiological SEIR + spatial attenuation framework:\n\n"
                "• **Medicine Demand Slider (-20% to +150%)**: Simulates community OTC purchase velocity.\n"
                "• **Fever Cases Slider (-20% to +150%)**: Adjusts localized clinical symptom volume.\n"
                "• **Clinic Visits Slider (-20% to +120%)**: Simulates outpatient health center strain.\n"
                "• **Geographic Spread (0 to 4 Wards)**: Models multi-ward spatial diffusion.\n"
                "• **Intervention Selection**: Test the mitigation efficacy of:\n"
                "  - *Vector Fumigation* (~35% transmission reduction)\n"
                "  - *Micro-Containment Buffer* (~65% transmission reduction)\n"
                "  - *Prophylaxis Distribution* (~50% mitigation)\n\n"
                "The gauge immediately recalculates the composite Risk Score, Effective Reproduction Number ($R_t$), and plots a 6-week projected trajectory curve!"
            ),
            "category": "APP_GUIDE",
            "suggested_questions": [
                "Open What-If Simulator",
                "How does Vector Fumigation reduce transmission?",
                "What is the Dengue Outbreak SOP?",
            ],
            "related_actions": ["TOGGLE_SIMULATOR"],
            "timestamp": now_iso,
        }

    if any(term in query for term in ["add observation", "how to add data", "ingest data", "new observation", "data form"]):
        return {
            "response": (
                "📝 **How to Ingest New Community Health Signals**\n\n"
                "To submit new syndromic observations into MEDISENTINEL:\n"
                "1. Click the **'+ Add Observation'** button in the top navigation bar.\n"
                "2. Select the target **Ward** (e.g. *Saheed Nagar, Patia, Cuttack CDA*).\n"
                "3. Choose the **Signal Category** (*Medicine Demand, Fever Cases, Clinic Visits, Respiratory Symptoms, GI Symptoms*).\n"
                "4. Enter the numerical value and data source (e.g. *Pharmacy POS Network, Sentinel Clinic, Field Worker*).\n"
                "5. Ensure **'Auto-recalculate Risk Engine'** is checked.\n"
                "6. Click **'Submit & Ingest'**.\n\n"
                "The backend immediately re-runs the anomaly detector, updates baseline deviations, and refreshes the live map!"
            ),
            "category": "APP_GUIDE",
            "suggested_questions": [
                "How does the Risk Engine work?",
                "View Current Baseline Comparison",
                "What is the status of Saheed Nagar?",
            ],
            "related_actions": ["OPEN_OBSERVATION_MODAL"],
            "timestamp": now_iso,
        }

    # -------------------------------------------------------------
    # 4. WARD-SPECIFIC EPIDEMIOLOGICAL ROOT CAUSE ANALYSIS
    # -------------------------------------------------------------
    if matched_area and any(term in query for term in ["why", "saheed", "patia", "cuttack", "puri", "khurda", "ward", "area", "status"]):
        area_name = matched_area.get("name", "Target Ward")
        risk_score = matched_area.get("riskScore", 87)
        risk_level = matched_area.get("riskLevel", "HIGH")
        signals = matched_area.get("signals", {})
        med_dev = signals.get("medicineDemand", {}).get("deviation", "+62%")
        fever_dev = signals.get("feverIndicators", {}).get("deviation", "+48%")
        clinic_dev = signals.get("clinicVisits", {}).get("deviation", "+38%")
        persist = matched_area.get("persistenceWeeks", 3)
        explanation = matched_area.get("explanation", "")
        sop = matched_area.get("recommendedAction", "")

        return {
            "response": (
                f"📊 **Epidemiological Risk Diagnostics: {area_name}**\n\n"
                f"• **Current Risk Level**: **{risk_level} RISK** ({risk_score}/100 Composite Score)\n"
                f"• **Leading Anomaly Drivers**:\n"
                f"  1. **OTC Medicine Demand**: Surged **{med_dev}** above baseline (lead indicator 5–6 days prior to hospital admissions).\n"
                f"  2. **Syndromic Fever Logs**: Elevated by **{fever_dev}**, corroborating real clinical transmission.\n"
                f"  3. **Clinic Outpatient Visits**: Increased by **{clinic_dev}**.\n"
                f"  4. **Temporal Persistence**: Anomaly sustained over **{persist} continuous observation weeks**.\n\n"
                f"🔍 **Surveillance Engine Assessment**:\n"
                f"\"{explanation}\"\n\n"
                f"🚨 **Prescribed Public Health Standard Operating Procedure (SOP)**:\n"
                f"{sop}\n\n"
                f"• *Recommended Action Plan*:\n"
                f"  1. Deploy Municipal Rapid Response Team (RRT) for ground spot-checks.\n"
                f"  2. Collect 25 randomized household water & mosquito larval density samples.\n"
                f"  3. Issue localized public health advisory in English & Odia."
            ),
            "category": "WARD_DIAGNOSIS",
            "suggested_questions": [
                f"What are the emergency SOPs for {area_name}?",
                "What is the Dengue Outbreak Prevention Protocol?",
                "Show full drill-down for this ward",
            ],
            "related_actions": ["VIEW_DRILLDOWN", "DISPATCH_RRT"],
            "timestamp": now_iso,
        }

    # -------------------------------------------------------------
    # 5. DISEASE-SPECIFIC OUTBREAK PREVENTION & SOPS
    # -------------------------------------------------------------
    # A. DENGUE / VECTOR BORNE
    if any(term in query for term in ["dengue", "mosquito", "vector", "aedes", "larvae", "fogging", "malaria", "chikungunya"]):
        return {
            "response": (
                "🦟 **Vector-Borne Outbreak (Dengue & Malaria) Control SOP**\n\n"
                "**1. Clinical & Syndromic Profile**:\n"
                "• **Primary Pathogen**: Dengue Virus (DENV 1-4) transmitted by *Aedes aegypti* (day-biting).\n"
                "• **Cardinal Symptoms**: High sudden fever, retro-orbital (behind eye) pain, severe myalgia/arthralgia ('breakbone fever'), skin rash.\n"
                "• **Red Flag Warning Signs**: Severe abdominal pain, persistent vomiting, mucosal bleeding, sudden drop in platelet count (<50,000/μL) requiring immediate hospital admission.\n\n"
                "**2. Municipal & Community Prevention Protocol**:\n"
                "• **Source Reduction (Dry Day)**: Observe once-weekly 'Dry Day' — drain, scrub, and invert all water coolers, flower pots, overhead tanks, and discarded tires.\n"
                "• **Anti-Larval Measures**: Apply Temephos (1ppm) or *Bacillus thuringiensis israelensis* (BTI) larvicide in non-potable stagnant water.\n"
                "• **Thermal Fogging**: Conduct Ultra-Low Volume (ULV) pyrethroid or malathion fogging in a 500-meter radius around index cases.\n\n"
                "**3. Clinical Management SOP**:\n"
                "• Maintain oral rehydration (ORS, coconut water, soup); aim for 2.5L - 3L fluid intake daily.\n"
                "• **Caution**: Use Paracetamol for fever. **NEVER take Aspirin, Ibuprofen, or NSAIDs** as they exacerbate bleeding risk."
            ),
            "category": "DISEASE_SOP",
            "suggested_questions": [
                "What are the warning signs of severe Dengue?",
                "How does the What-If Simulator model Vector Fumigation?",
                "What is the Waterborne Disease & Diarrhea Protocol?",
            ],
            "related_actions": ["VIEW_MAP", "TOGGLE_SIMULATOR"],
            "timestamp": now_iso,
        }

    # B. CHOLERA / WATERBORNE / ACUTE DIARRHEAL DISEASE
    if any(term in query for term in ["cholera", "diarrhea", "diarrhoea", "waterborne", "vomiting", "stomach", "typhoid", "gastro", "drinking water"]):
        return {
            "response": (
                "💧 **Waterborne Disease & Acute Diarrhea (Cholera/Typhoid) Protocol**\n\n"
                "**1. Epidemiological Characteristics**:\n"
                "• **Transmission Route**: Fecal-oral route through contaminated drinking water pipelines or street food.\n"
                "• **Symptoms**: Profuse watery diarrhea ('rice-water stools'), rapid dehydration, muscle cramps, severe vomiting.\n\n"
                "**2. Community Prevention & Sanitation SOP**:\n"
                "• **Super-Chlorination of Water Sources**: Maintain residual free chlorine level of **at least 0.5 mg/L** at user tap ends.\n"
                "• **Boiling Protocol**: Bring drinking water to a rolling boil for a minimum of 1 full minute.\n"
                "• **Halogen Tablet Distribution**: Distribute chlorine/Halazone tablets (1 tablet per 20 liters of water; wait 30 minutes before consuming).\n"
                "• **Food Safety Enforcement**: Ban exposed unhygienic cut fruits, raw salads, and ice from unlicensed sources.\n\n"
                "**3. Triage & Treatment Guidelines**:\n"
                "• **First-Line Intervention**: Immediate administration of WHO-formula Oral Rehydration Salts (ORS) solution + Zinc supplementation (20mg/day for 14 days in children).\n"
                "• **Severe Dehydration Warning**: Sunken eyes, skin pinch retracting >2 seconds, lethargy, low blood pressure — requires urgent IV Ringer's Lactate at nearest Community Health Centre (CHC)."
            ),
            "category": "DISEASE_SOP",
            "suggested_questions": [
                "How to prepare WHO ORS solution properly?",
                "What are the Dengue prevention SOPs?",
                "Why is Saheed Nagar showing elevated signals?",
            ],
            "related_actions": ["VIEW_DRILLDOWN"],
            "timestamp": now_iso,
        }

    # C. INFLUENZA / VIRAL RESPIRATORY
    if any(term in query for term in ["influenza", "flu", "cough", "respiratory", "covid", "cold", "sore throat", "breathing"]):
        return {
            "response": (
                "🫁 **Viral Respiratory (Influenza & ILI) Outbreak SOP**\n\n"
                "**1. Clinical Manifestation**:\n"
                "• **Pathogens**: Influenza A (H1N1/H3N2), RSV, SARS-CoV-2, Adenovirus.\n"
                "• **Symptoms**: Fever, dry cough, sore throat, nasal congestion, body aches, fatigue.\n\n"
                "**2. Infection Prevention and Control (IPC)**:\n"
                "• **Respiratory Etiquette**: Cover nose and mouth with elbow or tissue when coughing; discard used tissues immediately.\n"
                "• **Masking Protocols**: Mandatory triple-layer surgical masks or N95 respirators in crowded public areas and healthcare facilities.\n"
                "• **Hand Hygiene**: Wash hands with soap and water for at least 20 seconds, or use >=70% alcohol hand rub.\n"
                "• **Ventilation**: Ensure cross-ventilation in schools, clinics, and offices to reduce aerosol concentrations.\n\n"
                "**3. Clinical Triage**:\n"
                "• Isolate symptomatic individuals at home for 5-7 days until fever-free for 24 hours without antipyretics.\n"
                "• **Seek Emergency Care If**: Oxygen saturation ($SpO_2$) falls below 94%, persistent chest tightness, or shortness of breath occurs."
            ),
            "category": "DISEASE_SOP",
            "suggested_questions": [
                "What is the protocol for Fever Triage?",
                "How does MEDISENTINEL detect early respiratory surges?",
                "View Live Surveillance Map",
            ],
            "related_actions": ["VIEW_MAP"],
            "timestamp": now_iso,
        }

    # -------------------------------------------------------------
    # 6. GENERAL MEDICAL ADVISORY & SYMPTOM TRIAGE
    # -------------------------------------------------------------
    if any(term in query for term in ["medicine", "paracetamol", "fever", "tablet", "treatment", "doctor", "hospital", "emergency"]):
        return {
            "response": (
                "🩺 **Clinical Triage & Over-the-Counter (OTC) Guidance**\n\n"
                "**Standard Fever Management**:\n"
                "• **First-Line Antipyretic**: Paracetamol (500mg - 650mg for adults, every 4-6 hours as needed; max 3000mg/24h).\n"
                "• **Avoid**: Aspirin, Diclofenac, or Ibuprofen during fever outbreaks unless Dengue is ruled out, due to platelet dysfunction and bleeding hazards.\n"
                "• **Hydration**: Drink at least 2.5 to 3 liters of fluids daily (ORS, clear broths, tender coconut water).\n\n"
                "⚠️ **Emergency Red Flags (Visit Emergency Department Immediately)**:\n"
                "1. Temperature > 103°F (39.4°C) unresponsive to antipyretics.\n"
                "2. Extreme lethargy, confusion, or altered mental status.\n"
                "3. Persistent vomiting with inability to retain fluids.\n"
                "4. Difficulty breathing or chest heaviness.\n"
                "5. Petechial rashes (tiny red/purple spots on skin) or black stools.\n\n"
                "📞 **Emergency Helplines**:\n"
                "• **National Health Helpline**: `104`\n"
                "• **Emergency Ambulance**: `108`"
            ),
            "category": "MEDICAL_GUIDE",
            "suggested_questions": [
                "What is the Dengue Outbreak Prevention Protocol?",
                "What is the Waterborne Disease & Diarrhea SOP?",
                "How does MEDISENTINEL calculate risk?",
            ],
            "related_actions": ["VIEW_MAP"],
            "timestamp": now_iso,
        }

    # -------------------------------------------------------------
    # 7. GENERAL PUBLIC HEALTH INTELLIGENCE FALLBACK
    # -------------------------------------------------------------
    return {
        "response": (
            "🌐 **MEDISENTINEL Public Health Intelligence**\n\n"
            f"I analyzed your query: *\"{message}\"*\n\n"
            "Here is the relevant epidemiological intelligence from the surveillance repository:\n\n"
            "• **Early Warning Principle**: We continuously correlate multi-source signals (pharmacy OTC anti-infective purchases, outpatient syndromic fever logs, and spatial neighbor contagion) to detect abnormalities 5 to 7 days before traditional hospital reporting.\n"
            "• **Outbreak Containment**: Early vector control, chlorination, and targeted public health advisories reduce the effective reproduction rate ($R_t$) by up to 65%.\n"
            "• **Explainable Metrics**: Each ward is evaluated on Medicine (30%), Health (30%), Persistence (20%), and Geographic Spread (20%).\n\n"
            "You can ask me about specific diseases (Dengue, Cholera, Flu), prevention protocols, ward analytics, or how to use the dashboard features."
        ),
        "category": "GENERAL_EPIDEMIOLOGY",
        "suggested_questions": [
            "What are the Dengue Outbreak Prevention SOPs?",
            "Why is Saheed Nagar flagged as High Risk?",
            "How does the 4-Pillar Risk Score work?",
        ],
        "related_actions": ["VIEW_MAP", "RUN_RISK_ENGINE"],
        "timestamp": now_iso,
    }
