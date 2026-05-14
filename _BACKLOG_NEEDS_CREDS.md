# Backlog — credentials required

These integrations are scaffolded as 503 stubs in
`backend/routes/integrations.js`. To activate any of them, set the
corresponding env var(s) and replace the `TODO` provider call in the
handler with the real SDK call.

| Endpoint                            | Required env var(s)                              |
|-------------------------------------|--------------------------------------------------|
| `POST /api/integrations/instagram/profile` | `INSTAGRAM_ACCESS_TOKEN`                  |
| `POST /api/integrations/tiktok/profile`    | `TIKTOK_ACCESS_TOKEN`                     |
| `POST /api/integrations/youtube/channel`   | `YOUTUBE_API_KEY`                         |
| `POST /api/integrations/stripe/payout`     | `STRIPE_SECRET_KEY`                       |
| `POST /api/integrations/paypal/payout`     | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` |

`GET /api/integrations/status` returns a boolean per provider so the FE
dashboard can surface which ones are live.
