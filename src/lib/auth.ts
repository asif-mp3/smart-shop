import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { getDatabase } from "./db";

// Initialize auth instance asynchronously
export const authPromise = getDatabase().then((db) =>
  betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [nextCookies()],
  })
);

// Export a helper to get the auth instance
export async function getAuth() {
  return authPromise;
}

// For type inference
type AuthType = Awaited<typeof authPromise>;
export type Session = AuthType["$Infer"]["Session"];
