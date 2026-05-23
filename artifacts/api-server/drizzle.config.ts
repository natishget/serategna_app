import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts", // Path to your schema file
  out: "./drizzle",            // Where your migrations will be saved
  dbCredentials: {
    url: "postgresql://postgres.jkdibbjmhpatadjinbbb:PBer9SsjGJ2eFf*@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  },
});
