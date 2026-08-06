export const TEST_APP_PORT = 3100;
export const TEST_APP_URL = `http://localhost:${TEST_APP_PORT}`;

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://booking:booking@localhost:5433/booking_test?schema=public";
