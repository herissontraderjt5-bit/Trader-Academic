const { Pool } = require('pg');

const urls = [
    `postgresql://postgres:DyRFb93h4bIP3yEy@db.riqvuwcwsymkvlsaunwh.supabase.co:5432/postgres`
];

async function test() {
    for (const url of urls) {
        console.log('\nTesting:', url.replace(/:[^:@]+@/, ':****@'));
        const pool = new Pool({
            connectionString: url,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 8000,
        });
        try {
            const res = await pool.query('SELECT current_database()');
            console.log('SUCCESS! DB:', res.rows[0].current_database);
            await pool.end();
            break;
        } catch (err) {
            console.log('FAILED:', err.message);
            await pool.end().catch(() => { });
        }
    }
}

test();
