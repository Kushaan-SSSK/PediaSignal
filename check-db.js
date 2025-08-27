import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

async function checkDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔌 Connecting to database...');
    
    // Check what tables exist
    console.log('📋 Checking existing tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables found:', tables.rows.map(row => row.table_name));
    
    // Check the structure of kb_passages if it exists
    if (tables.rows.some(row => row.table_name === 'kb_passages')) {
      console.log('\n📊 Checking kb_passages structure...');
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'kb_passages'
        ORDER BY ordinal_position;
      `);
      
      console.log('Columns in kb_passages:');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check if there's any data
      const count = await pool.query('SELECT COUNT(*) as count FROM kb_passages');
      console.log(`\n📝 Current data count: ${count.rows[0].count}`);
      
      if (count.rows[0].count > 0) {
        const sample = await pool.query('SELECT * FROM kb_passages LIMIT 1');
        console.log('\n📄 Sample row:');
        console.log(JSON.stringify(sample.rows[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
