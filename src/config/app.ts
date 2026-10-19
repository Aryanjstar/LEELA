export type AppEnv = {
  origin: string;
  ownerEmail: string;
  pepper: string;
  mongoUri: string;
  mongoDb: string;
};

export function appEnv(): AppEnv {
  const mongoDb = process.env.MONGODB_DB || "leela-dev";
  if (mongoDb === "leela" && process.env.NODE_ENV !== "production") {
    throw new Error('Refusing database name "leela" outside production. Use leela-dev.');
  }
  return {
    origin: process.env.APP_ORIGIN || "http://localhost:3000",
    ownerEmail: (process.env.OWNER_EMAIL || "").toLowerCase(),
    pepper: process.env.AUTH_TOKEN_PEPPER || "",
    mongoUri: process.env.MONGODB_URI || "",
    mongoDb,
  };
}
