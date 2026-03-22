const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.owalvxcjyzvqvfntjzyf:GAaP3gAS7OX8w8v7@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();

    console.log("Dropping existing CHECK constraint...");
    await client.query(`
      ALTER TABLE appointments 
      DROP CONSTRAINT IF EXISTS appointments_consultation_type_check;
    `);

    console.log("Adding updated CHECK constraint to include 'Messaging'...");
    await client.query(`
      ALTER TABLE appointments 
      ADD CONSTRAINT appointments_consultation_type_check 
      CHECK (consultation_type IN ('Video Consultation', 'Voice Call', 'Messaging'));
    `);

    console.log("Successfully updated appointments table CHECK constraint.");
  } catch (err) {
    console.error("Error updating constraint:", err);
  } finally {
    await client.end();
  }
}
run();
