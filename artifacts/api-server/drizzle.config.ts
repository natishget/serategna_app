import { defineConfig } from "drizzle-kit";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts", // Path to your schema file
  out: "./drizzle", // Where your migrations will be saved
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
