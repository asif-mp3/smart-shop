import { toNextJsHandler } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { getDatabase } from "@/lib/db";

// Initialize auth with async database connection
const authPromise = getDatabase().then((db) =>
  betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [nextCookies()],
  })
);

export async function GET(request: Request) {
  const auth = await authPromise;
  const handler = toNextJsHandler(auth);
  return handler.GET(request);
}

export async function POST(request: Request) {
  const auth = await authPromise;
  const handler = toNextJsHandler(auth);
  return handler.POST(request);
}
