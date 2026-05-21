# Local Service Lead To Cash

## Category
Small Business Services

## Goal
Help a local service business convert an inbound customer message into a quoted, scheduled, and owner-reviewable job.

## Inputs
- Business profile: service area, operating hours, technician, service catalog, and prices.
- Customer message: free-text request from WhatsApp, web chat, or email.
- Urgency: same-day, this-week, or flexible.

## Gemini Steps
1. Extract service type, location, urgency, and missing details.
2. Match the request against the business service catalog.
3. Generate a quote with line items and confidence.
4. Pick a booking window or escalate to the owner if confidence is low.
5. Draft invoice follow-up and post-job review request.
6. Write an evidence entry with model, trace id, decisions logged, quote amount, and source mode.

## Human Review Gates
- Escalate if service type is unknown.
- Escalate if the customer asks for regulated, medical, legal, or safety-sensitive advice.
- Escalate before sending payment links or making irreversible calendar changes.

## Evidence
The prototype logs deterministic demo evidence by default. Live evidence is only claimed when `GEMINI_API_KEY` is configured and the run source is `gemini-api`.
