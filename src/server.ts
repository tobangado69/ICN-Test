import app from "./app";
import { environment } from "./config/environment";
import { prisma } from "./lib/prisma";

console.log('[startup] modules loaded');

async function main(): Promise<void> {
  console.log('[startup] 4 main()');
  try {
    console.log('[startup] 5 connecting to DB...');
    await prisma.$connect();
    console.log("Database connected");
  } catch (e) {
    console.error("DB connection failed", e);
    process.exit(1);
  }
  console.log('[startup] 6 starting HTTP server');
  app.listen(environment.PORT, () =>
    console.log(`Server running on port ${environment.PORT}`)
  );
}

main().catch((e) => {
  console.error('Startup failed', e);
  process.exit(1);
});