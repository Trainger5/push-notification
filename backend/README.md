Setup

1) Copy .env.example to .env and set values.
2) Install deps: npm i
3) Run dev: npm run dev

Endpoints (high level)
- POST /api/auth/login
- GET /api/admin/customers, POST /api/admin/customers, PATCH /api/admin/customers/:id/toggle, POST /api/admin/customers/:id/keys/regenerate
- GET /api/customer/me, POST /api/customer/settings, POST /api/customer/notify, GET /api/customer/subscribers
- GET /api/config?apiKey=KEY, POST /api/subscribe, POST /api/unsubscribe


