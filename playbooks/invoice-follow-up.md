# Invoice Follow Up

## Category
Professional Services Access

## Goal
Help owners recover unpaid service invoices without losing customer trust.

## Inputs
- Invoice amount, due date, and service description.
- Customer contact channel.
- Prior reminder history.

## Gemini Steps
1. Classify the invoice status as upcoming, due, overdue, or disputed.
2. Draft a channel-appropriate reminder.
3. Include service context and payment instructions without exposing sensitive payment data.
4. Queue the reminder for owner review.
5. Log the reminder, decision rationale, and follow-up window.

## Human Review Gates
- Owner approval is required before sending reminders.
- Escalate if the customer disputes quality, price, safety, or completion.
- Do not store full card numbers, CVV, banking passwords, or one-time passcodes.

## Evidence
Each approved reminder can become evidence for repeat operational use, customer recovery workflow, and AI decision traceability.
