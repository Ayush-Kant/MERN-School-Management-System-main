# Backend test environment

Run the backend suite from this directory with:

```powershell
npm test
```

The test script preloads `tests/test-env.js`, which sets `NODE_ENV=test` and
overrides `MONGO_URL` with the local `school_management_test` database URI.
The current suite uses dependency-injected model doubles and does not connect
to MongoDB. The URI is a safety default for future integration tests; do not
replace it with a development or production database URL.

Tests use a dedicated test-only session secret. Never reuse it outside tests.
