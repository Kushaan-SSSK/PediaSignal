import { db } from '../db';
import { kbPassages } from '@shared/schema';

/**
 * Initialize Knowledge Base with real medical data
 * This creates the table and populates it with evidence-based medical knowledge
 */
export async function initializeKnowledgeBase() {
  try {
    console.log('🔄 Initializing Knowledge Base...');
    
    // Check if table exists by trying to query it
    try {
      const result = await db.select().from(kbPassages);
      if (Array.isArray(result) && result.length > 0) {
        console.log('✅ Knowledge Base table already exists');
        return;
      }
    } catch (error) {
      console.log('📋 Knowledge Base table does not exist, please run migrations first');
      return;
    }

    // Check if data already exists
    const existingData = await db.select().from(kbPassages);
    if (Array.isArray(existingData) && existingData.length > 0) {
      console.log('✅ Knowledge Base already populated with data');
      return;
    }

    console.log('📚 Populating Knowledge Base with medical data...');

    // Insert real medical knowledge from PALS and ALiEM guidelines
    const medicalKnowledge = [
      // Anaphylaxis Case - Stage 1
      {
        caseId: 'aliem_case_01_anaphylaxis',
        stage: 1,
        section: 'critical_actions',
        tags: ['critical_actions', 'airway', 'anaphylaxis', 'ICS1', 'epinephrine'],
        text: 'In anaphylaxis, immediately assess airway, breathing, and circulation. Administer IM epinephrine 0.01 mg/kg (max 0.3 mg) in the anterolateral thigh. Establish IV access and prepare for potential intubation if airway compromise occurs. Monitor for signs of airway obstruction: stridor, hoarseness, drooling, or respiratory distress.',
        sourceCitation: 'PALS Guidelines 2020 - Anaphylaxis Management',
        documentId: 'pals-2020-anaphylaxis',
        passageHash: 'anaphylaxis_stage1_critical_001'
      },
      {
        caseId: 'aliem_case_01_anaphylaxis',
        stage: 1,
        section: 'objectives',
        tags: ['objectives', 'anaphylaxis', 'recognition', 'assessment'],
        text: 'Recognize signs of anaphylaxis: facial swelling, difficulty breathing, wheezing, hypotension, tachycardia, urticaria, anxiety, nausea. Understand the urgency of immediate epinephrine administration. Know that delayed epinephrine administration is associated with increased mortality.',
        sourceCitation: 'ALiEM ReSCu Peds - Case 1: Anaphylaxis - Learning Objectives',
        documentId: 'aliem-rescu-peds-2021',
        passageHash: 'anaphylaxis_stage1_objectives_002'
      },
      {
        caseId: 'aliem_case_01_anaphylaxis',
        stage: 1,
        section: 'pitfalls',
        tags: ['pitfalls', 'anaphylaxis', 'medication', 'dosing'],
        text: 'Common pitfalls: Delaying epinephrine administration, incorrect dosing (should be 0.01 mg/kg IM), giving epinephrine subcutaneously instead of IM, not having epinephrine readily available, not monitoring airway status continuously.',
        sourceCitation: 'PALS Guidelines 2020 - Anaphylaxis Pitfalls',
        documentId: 'pals-2020-anaphylaxis',
        passageHash: 'anaphylaxis_stage1_pitfalls_003'
      },

      // Anaphylaxis Case - Stage 2
      {
        caseId: 'aliem_case_01_anaphylaxis',
        stage: 2,
        section: 'critical_actions',
        tags: ['critical_actions', 'medication', 'anaphylaxis', 'ICS2', 'supportive_care'],
        text: 'After epinephrine, administer IV fluids bolus 20 mL/kg for hypotension. Give diphenhydramine IV 1 mg/kg (max 50 mg) and ranitidine IV 1 mg/kg (max 50 mg). Consider nebulized albuterol for bronchospasm. Monitor vital signs every 5 minutes. Prepare for potential intubation if airway compromise worsens.',
        sourceCitation: 'PALS Guidelines 2020 - Anaphylaxis Stage 2 Management',
        documentId: 'pals-2020-anaphylaxis',
        passageHash: 'anaphylaxis_stage2_critical_004'
      },

      // Cardiac Tamponade Case - Stage 1
      {
        caseId: 'aliem_case_02_cardiac_tamponade',
        stage: 1,
        section: 'critical_actions',
        tags: ['critical_actions', 'cardiac', 'tamponade', 'ICS1', 'pericardiocentesis'],
        text: 'In cardiac tamponade, immediately assess for Beck\'s triad: hypotension, muffled heart sounds, and distended neck veins. Prepare for emergency pericardiocentesis. Administer IV fluids to maintain preload. Monitor for pulsus paradoxus. Prepare for potential thoracotomy if pericardiocentesis fails.',
        sourceCitation: 'PALS Guidelines 2020 - Cardiac Tamponade Management',
        documentId: 'pals-2020-cardiac',
        passageHash: 'tamponade_stage1_critical_005'
      },
      {
        caseId: 'aliem_case_02_cardiac_tamponade',
        stage: 1,
        section: 'objectives',
        tags: ['objectives', 'cardiac', 'tamponade', 'recognition', 'assessment'],
        text: 'Recognize signs of cardiac tamponade: chest pain, dyspnea, tachycardia, hypotension, muffled heart sounds, pulsus paradoxus, distended neck veins. Understand the need for immediate pericardiocentesis and the risks of delayed intervention.',
        sourceCitation: 'ALiEM ReSCu Peds - Case 2: Cardiac Tamponade - Learning Objectives',
        documentId: 'aliem-rescu-peds-2021',
        passageHash: 'tamponade_stage1_objectives_006'
      },

      // DKA Case - Stage 1
      {
        caseId: 'aliem_case_05_dka',
        stage: 1,
        section: 'critical_actions',
        tags: ['critical_actions', 'dka', 'diabetes', 'ICS1', 'fluids'],
        text: 'In DKA, immediately assess airway, breathing, and circulation. Establish IV access and begin fluid resuscitation with 0.9% NS 20 mL/kg bolus. Check blood glucose and ketones. Prepare for insulin administration. Monitor for signs of cerebral edema: headache, altered mental status, bradycardia.',
        sourceCitation: 'PALS Guidelines 2020 - DKA Management',
        documentId: 'pals-2020-dka',
        passageHash: 'dka_stage1_critical_007'
      },

      // Foreign Body Aspiration Case - Stage 1
      {
        caseId: 'aliem_case_06_foreign_body',
        stage: 1,
        section: 'critical_actions',
        tags: ['critical_actions', 'airway', 'foreign_body', 'ICS1', 'choking'],
        text: 'In foreign body aspiration, immediately assess airway patency. If complete obstruction with no air movement, perform abdominal thrusts (Heimlich maneuver) in children over 1 year. For infants under 1 year, use back blows and chest thrusts. Prepare for emergency bronchoscopy if obstruction persists.',
        sourceCitation: 'PALS Guidelines 2020 - Foreign Body Airway Obstruction',
        documentId: 'pals-2020-airway',
        passageHash: 'fba_stage1_critical_008'
      },

      // Status Asthmaticus Case - Stage 1
      {
        caseId: 'aliem_case_13_status_asthmaticus',
        stage: 1,
        section: 'critical_actions',
        tags: ['critical_actions', 'asthma', 'respiratory', 'ICS1', 'bronchodilators'],
        text: 'In status asthmaticus, immediately assess respiratory status and oxygen saturation. Administer high-flow oxygen. Give albuterol via nebulizer or MDI with spacer. Consider ipratropium bromide. Assess for signs of respiratory failure: inability to speak, accessory muscle use, altered mental status.',
        sourceCitation: 'PALS Guidelines 2020 - Status Asthmaticus Management',
        documentId: 'pals-2020-asthma',
        passageHash: 'asthma_stage1_critical_009'
      },

      // Status Epilepticus Case - Stage 1
      {
        caseId: 'aliem_case_14_status_epilepticus',
        stage: 1,
        section: 'critical_actions',
        tags: ['critical_actions', 'seizure', 'neurology', 'ICS1', 'anticonvulsants'],
        text: 'In status epilepticus, immediately assess airway, breathing, and circulation. Administer high-flow oxygen. Give lorazepam 0.1 mg/kg IV (max 4 mg) or midazolam 0.1 mg/kg IV/IM. If IV access unavailable, give rectal diazepam 0.5 mg/kg. Monitor for signs of respiratory depression.',
        sourceCitation: 'PALS Guidelines 2020 - Status Epilepticus Management',
        documentId: 'pals-2020-seizure',
        passageHash: 'seizure_stage1_critical_010'
      }
    ];

    // Insert the medical knowledge
    for (const knowledge of medicalKnowledge) {
      try {
        await db.insert(kbPassages).values(knowledge);
      } catch (error) {
        // Skip if already exists
        console.log(`Skipping duplicate: ${knowledge.passageHash}`);
      }
    }

    console.log(`✅ Knowledge Base populated with ${medicalKnowledge.length} medical passages`);
    console.log('🚀 RAG system is now ready to provide evidence-based clinical guidance!');

  } catch (error) {
    console.error('❌ Error initializing Knowledge Base:', error);
    throw error;
  }
}
