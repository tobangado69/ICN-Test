import app from "./app";
import { environment } from "./config/environment";
import { prisma } from "./lib/prisma";

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (e) {
    console.error("DB connection failed", e);
    process.exit(1);
  }
  app.listen(environment.PORT, () =>
    console.log(`Server running on port ${environment.PORT}`)
  );
}