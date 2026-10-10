import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Same default as .env.example so `npm install` (prisma generate) works on a
    // fresh clone before .env exists. The app itself requires DATABASE_URL.
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
