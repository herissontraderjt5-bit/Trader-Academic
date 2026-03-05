const { Pool } = require('pg');

const pass = 'NWjmWtkwgV2WhsOb';
const urls = [
    `postgresql://postgres.kcxazxhzmnrmngvffavm:${pass}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.kcxazxhzmnrmngvffavm:${pass}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`
];

async function test() {
    for (const url of urls) {
        console.log('\nTesting:', url.replace(/:[^:@]+@/, ':****@'));
        const pool = new Pool({
            connectionString: url,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });
        try {
            const res = await pool.query('SELECT current_database()');
            console.log('SUCCESS! DB:', res.rows[0].current_database);
            await pool.end();
            console.log('--- FOUND WORKING URL ---');
            return;
        } catch (err) {
            console.log('FAILED:', err.message);
            await pool.end().catch(() => { });
        }
    }
}

test();
