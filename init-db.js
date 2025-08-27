import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

async function initDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔌 Connecting to database...');
    
    // Insert sample data for the anaphylaxis case using the existing schema
    console.log('📝 Inserting sample data...');
    await pool.query(`
      INSERT INTO kb_passages ("caseId", stage, section, tags, text, "sourceCitation", license) VALUES
      ('aliem_case_01_anaphylaxis', 1, 'critical_actions', '["anaphylaxis", "epinephrine", "airway"]', 'IM epinephrine 0.01 mg/kg (max 0.3 mg) in anterolateral thigh is the gold standard first-line treatment for anaphylaxis. Administer immediately upon recognition of anaphylaxis symptoms. Delayed administration is associated with increased mortality. Monitor airway status continuously and prepare for potential intubation if airway compromise worsens.', 'ALiEM ReSCu Peds Case 1: Anaphylaxis', 'CC BY-NC-SA 4.0'),
      ('aliem_case_01_anaphylaxis', 1, 'critical_actions', '["anaphylaxis", "fluids", "hypotension"]', 'Administer 20 mL/kg bolus of 0.9% NS for hypotension. Monitor for signs of fluid overload. Consider second bolus if persistent hypotension after epinephrine. Assess for fluid responsiveness and monitor urine output.', 'ALiEM ReSCu Peds Case 1: Anaphylaxis', 'CC BY-NC-SA 4.0'),
      ('aliem_case_01_anaphylaxis', 1, 'critical_actions', '["anaphylaxis", "antihistamine", "histamine"]', 'Administer diphenhydramine 1 mg/kg IV for histamine-mediated symptoms. This is adjunctive therapy and should not delay epinephrine administration. Monitor for sedation and anticholinergic effects.', 'ALiEM ReSCu Peds Case 1: Anaphylaxis', 'CC BY-NC-SA 4.0'),
      ('aliem_case_01_anaphylaxis', 1, 'critical_actions', '["anaphylaxis", "h2_blocker", "histamine"]', 'Administer ranitidine 1 mg/kg IV (max 50 mg) for additional histamine blockade. This provides more complete histamine receptor antagonism when combined with H1 blockers.', 'ALiEM ReSCu Peds Case 1: Anaphylaxis', 'CC BY-NC-SA 4.0'),
      ('aliem_case_01_anaphylaxis', 1, 'critical_actions', '["anaphylaxis", "steroids", "biphasic"]', 'Administer methylprednisolone 1-2 mg/kg IV for prevention of biphasic reactions. Onset of action is 4-6 hours. Monitor for hyperglycemia and consider stress-dose steroids if patient is on chronic steroids.', 'ALiEM ReSCu Peds Case 1: Anaphylaxis', 'CC BY-NC-SA 4.0'),
      ('aliem_case_01_anaphylaxis', 1, 'critical_actions', '["anaphylaxis", "beta_agonist", "bronchospasm"]', 'Administer albuterol 2.5 mg via nebulizer for bronchospasm. Repeat every 20 minutes as needed. Monitor for tachycardia and consider switching to levalbuterol if significant side effects occur.', 'ALiEM ReSCu Peds Case 1: Anaphylaxis', 'CC BY-NC-SA 4.0'),
      ('aliem_case_01_anaphylaxis', 1, 'objectives', '["anaphylaxis", "recognition", "abc"]', 'Recognize anaphylaxis based on acute onset of symptoms involving skin, respiratory, cardiovascular, or gastrointestinal systems. Always assess airway, breathing, and circulation first. Establish IV access early for potential interventions.', 'ALiEM ReSCu Peds Case 1: Anaphylaxis', 'CC BY-NC-SA 4.0'),
      ('aliem_case_01_anaphylaxis', 1, 'objectives', '["anaphylaxis", "monitoring", "vitals"]', 'Monitor vital signs continuously every 5 minutes. Watch for signs of airway compromise, respiratory distress, and cardiovascular instability. Be prepared to escalate care if patient deteriorates.', 'ALiEM ReSCu Peds Case 1: Anaphylaxis', 'CC BY-NC-SA 4.0');
    `);
    
    console.log('✅ Database initialized successfully!');
    
    // Verify the data was inserted
    const result = await pool.query('SELECT COUNT(*) as count FROM kb_passages');
    console.log(`📊 Total passages in database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();
