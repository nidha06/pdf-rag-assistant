import "dotenv/config";
import {
  defineConfig,
  env,
} from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  /*
   * Prisma CLI and migrations use
   * Neon's direct connection.
   */
  datasource: {
    url: env("DIRECT_URL"),
  },
});