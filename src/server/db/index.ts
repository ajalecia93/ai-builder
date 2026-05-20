import { drizzle }   from 'drizzle-orm/postgres-js';
import postgres       from 'postgres';
import * as schema    from './schema';
import * as relations from './relations';

const globalForDb = globalThis as unknown as { conn: postgres.Sql | undefined };
const conn = globalForDb.conn ?? postgres(process.env.DATABASE_URL!, { ssl: 'require' });
if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn, { schema: { ...schema, ...relations } });