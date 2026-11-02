// This file is preloaded only by the backend test script.
process.env.NODE_ENV = "test";

// The current unit suite uses injected model doubles and never opens a MongoDB
// connection. Keep any future accidental connection pointed at a local test
// database instead of inheriting the developer's normal MONGO_URL.
process.env.MONGO_URL = "mongodb://127.0.0.1:27017/school_management_test";
process.env.FRONTEND_URLS = "http://localhost:3000";
process.env.AUTH_SESSION_SECRET = "unit-test-only-session-secret-do-not-use-in-production";
