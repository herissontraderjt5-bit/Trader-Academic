import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

// Manually read .env
const env = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!databaseUrl) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query("SELECT id, referrer_id, commission_earned FROM trader.referrals WHERE status = 'pending' AND CAST(commission_earned AS NUMERIC) > 0");
        console.log(`Found ${res.rows.length} referrals to fix.`);

        for (const ref of res.rows) {
            const amount = parseFloat(ref.commission_earned);
            console.log(`Updating User ${ref.referrer_id}: adding ${amount}`);

            await pool.query("UPDATE trader.users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2", [amount, ref.referrer_id]);
            await pool.query("UPDATE trader.referrals SET status = 'converted' WHERE id = $1", [ref.id]);
        }
        console.log('Done.');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
