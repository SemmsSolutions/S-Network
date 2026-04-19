const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.exqvpzijavrbpfzqixnk:semms%40snetwor@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function run() {
    try {
        await client.connect();

        // Get businesses table columns
        const cols = await client.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='businesses' ORDER BY ordinal_position"
        );
        console.log('=== BUSINESSES COLUMNS ===');
        console.log(JSON.stringify(cols.rows, null, 2));

        // Get all tables
        const tables = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
        );
        console.log('\n=== ALL TABLES ===');
        console.log(tables.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
