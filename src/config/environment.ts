import 'dotenv/config';

function requireEnv(key: string): string {
    const v = process.env[key];
    if(!v) throw new Error(`Missing env:${key}`);
    return v;
}

const environment = {
    PORT: parseInt(process.env.PORT ?? '3000', 10),
    DATABASE_URL: requireEnv('DATABASE_URL'),
    DB_HOST: requireEnv('DB_HOST'),
    DB_PORT: requireEnv('DB_PORT'),
    DB_NAME: requireEnv('DB_NAME'),
    DB_USER: requireEnv('DB_USER'),
    DB_PASSWORD: requireEnv('DB_PASSWORD'),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1h',
} as const;

export { environment , requireEnv};