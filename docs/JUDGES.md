# Actionable Justice OS — Judge one-pager

- **What it is**: An execution-first legal redressal stack: SOS broadcast, RAG statute mapping, automated notice filing, and a persistence loop (7d / 14d) over email.
- **Live touchpoints**: `POST /grievance/intent` → `POST /grievance`; `POST /sos/trigger` (Socket.io room `/sos` for delivery status). Deep link `tel:112` for national emergency.
- **Tech depth**: NestJS (REST + BullMQ + Socket.io), Prisma/Postgres, Upstash Redis, Google Places (server-only), SendGrid, Twilio.

## Twilio trial (demo)

**Trial accounts can only SMS or WhatsApp to phone numbers you have explicitly verified in the Twilio console.** This is a Twilio product limit, not an app bug — fine for a hackathon demo if you pre-verify 1–2 judge/team numbers.

## Env you need in production

- **API / worker**: `DATABASE_URL`, `REDIS_URL`, `SENDGRID_*`, Twilio and Places keys as in `render.yaml` / your host. **Never** expose `GOOGLE_PLACES_API_KEY` to the browser; all Place runs server-side in the API.
