import 'dotenv/config';

console.log('[startup] loading environment');
function requireEnv(key: string): string {
    const v = process.env[key];
    if (!v) throw new Error(`Missing env:${key}`);
    return v;
}

function getDatabaseUrl(): string {
    const url =
        process.env.DATABASE_URL ??
        process.env.POSTGRES_PRISMA_URL ??
        process.env.POSTGRES_URL ??
        '';
    if (!url) throw new Error('Missing DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL');
    return url;
}

const environment = {
    PORT: parseInt(process.env.PORT ?? '3000', 10),
    DATABASE_URL: getDatabaseUrl(),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1h',
} as const;

export { environment, requireEnv };