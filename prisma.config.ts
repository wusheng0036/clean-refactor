import { defineConfig } from "prisma";

export default defineConfig({
  database: {
    url: env("DATABASE_URL"),
  },
});
