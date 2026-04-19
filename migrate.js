const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.exqvpzijavrbpfzqixnk:semms%40snetwor@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to Supabase PostgreSQL');

        await client.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_on_vacation BOOLEAN DEFAULT false');
        console.log('Successfully added is_on_vacation column');

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await client.end();
    }
}

run();
