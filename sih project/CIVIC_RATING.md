# Civic Compliance Rating

MediSentinel now includes an area-level Civic Compliance Rating for active alerts.

## What it measures

The feature estimates how strongly the available evidence indicates that an affected area is following a specific active advisory. It is **not an individual citizen score** and it never treats missing participation as non-compliance.

## Data model

The MVP reuses the existing `observations` table. Civic signals use:

- `signal_type = civic_compliance`
- `category = civic:<alert_id>`
- `value = 0..100`
- `source` to identify the evidence source
- `data_quality_score` to weight evidence

This avoids adding a second telemetry store while fitting the existing area/observation architecture.

## API

### Anonymous public feedback

`POST /api/dashboard/civic/feedback`

```json
{
  "area_id": 17,
  "alert_id": 105,
  "response": "FOLLOWING"
}
```

Accepted responses are `FOLLOWING`, `NOT_FOLLOWING`, and `NOT_APPLICABLE`. The MVP stores no user identity for this endpoint. `NOT_APPLICABLE` has zero scoring weight.

### Authorized area-level signal

`POST /api/dashboard/civic/signal`

Requires ADMIN or HEALTH_OFFICIAL and accepts an aggregated score from an authorized source.

### Read a rating

`GET /api/dashboard/civic/rating?area_id=17&alert_id=105`

### Read the dashboard overview

`GET /api/dashboard/civic/overview`

## Scoring

The current score is a quality-weighted average of valid signals from the previous two hours. Confidence combines signal volume and average source quality. The trend compares the most recent hour with the preceding hour.

- `80-100`: HIGH
- `50-79.9`: MODERATE
- `0-49.9`: LOW
- no valid signals: INSUFFICIENT_DATA

The score is intentionally presented as an **estimate**. It must not be described as the percentage of the entire population following a rule.

## Extending beyond the MVP

A production deployment can feed `/civic/signal` from authorized municipal, traffic, environmental, IoT, or other aggregated systems. A public QR/web/SMS client can call `/civic/feedback` so people without the MediSentinel app can still contribute a voluntary anonymous signal.
