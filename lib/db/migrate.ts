import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const runMigrate = async () => {
  const connection = postgres(process.env.POSTGRES_URL!, { max: 1 });
  const db = drizzle(connection);
  await migrate(db, { migrationsFolder: "lib/db/migrations" });
  await connection.end();
};

runMigrate().catch(console.error);
