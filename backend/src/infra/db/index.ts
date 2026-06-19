import * as schema from "./schema.js";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connection = postgres(
  process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/career_copilot",
);

export const db = drizzle(connection, { schema });
