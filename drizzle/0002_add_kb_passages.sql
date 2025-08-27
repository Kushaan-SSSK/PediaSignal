-- Migration to add knowledge base passages table for RAG system
CREATE TABLE "kb_passages" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL, -- e.g., "aliem-case-01"
	"stage" integer NOT NULL, -- Simulation stage
	"section" text NOT NULL, -- objectives | critical_actions | debrief | actor_prompts | pitfalls
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL, -- e.g., ["ICS1","red-flag","airway"]
	"text" text NOT NULL, -- Chunked text content
	"embedding" jsonb, -- Vector embedding (stored as JSON if not using pgvector)
	"source_citation" text NOT NULL, -- case title, page/section
	"license" text NOT NULL DEFAULT 'CC BY-NC-SA 4.0',
	"document_id" text NOT NULL, -- Reference to uploaded document
	"passage_hash" text NOT NULL, -- Hash for deduplication
	"created_at" timestamp DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX "idx_kb_passages_case_id" ON "kb_passages" ("case_id");
CREATE INDEX "idx_kb_passages_stage" ON "kb_passages" ("stage");
CREATE INDEX "idx_kb_passages_section" ON "kb_passages" ("section");
CREATE INDEX "idx_kb_passages_tags" ON "kb_passages" USING GIN ("tags");

-- Add some sample knowledge base passages for ALiEM cases
INSERT INTO "kb_passages" ("case_id", "stage", "section", "tags", "text", "source_citation", "license", "document_id", "passage_hash") VALUES
('aliem_case_01_anaphylaxis', 1, 'critical_actions', '["critical_actions","airway","anaphylaxis","ICS1"]', 'In anaphylaxis, immediately assess airway, breathing, and circulation. Administer IM epinephrine 0.01 mg/kg (max 0.3 mg) in the anterolateral thigh. Establish IV access and prepare for potential intubation if airway compromise occurs.', 'ALiEM ReSCu Peds - Case 1: Anaphylaxis - Critical Actions', 'CC BY-NC-SA 4.0', 'aliem-rescu-peds-2021', 'hash_001'),
('aliem_case_01_anaphylaxis', 1, 'objectives', '["objectives","anaphylaxis","recognition"]', 'Recognize signs of anaphylaxis: facial swelling, difficulty breathing, wheezing, hypotension, tachycardia, urticaria. Understand the urgency of immediate epinephrine administration.', 'ALiEM ReSCu Peds - Case 1: Anaphylaxis - Learning Objectives', 'CC BY-NC-SA 4.0', 'aliem-rescu-peds-2021', 'hash_002'),
('aliem_case_01_anaphylaxis', 2, 'critical_actions', '["critical_actions","medication","anaphylaxis","ICS2"]', 'After epinephrine, administer IV fluids bolus 20 mL/kg for hypotension. Give diphenhydramine IV 1 mg/kg (max 50 mg) and ranitidine IV 1 mg/kg (max 50 mg). Consider nebulized albuterol for bronchospasm.', 'ALiEM ReSCu Peds - Case 1: Anaphylaxis - Stage 2 Actions', 'CC BY-NC-SA 4.0', 'aliem-rescu-peds-2021', 'hash_003'),
('aliem_case_02_cardiac_tamponade', 1, 'critical_actions', '["critical_actions","cardiac","tamponade","ICS1"]', 'In cardiac tamponade, immediately assess for Beck''s triad: hypotension, muffled heart sounds, and distended neck veins. Prepare for emergency pericardiocentesis. Administer IV fluids to maintain preload.', 'ALiEM ReSCu Peds - Case 2: Cardiac Tamponade - Critical Actions', 'CC BY-NC-SA 4.0', 'aliem-rescu-peds-2021', 'hash_004'),
('aliem_case_02_cardiac_tamponade', 1, 'objectives', '["objectives","cardiac","tamponade","recognition"]', 'Recognize signs of cardiac tamponade: chest pain, dyspnea, tachycardia, hypotension, muffled heart sounds, pulsus paradoxus. Understand the need for immediate pericardiocentesis.', 'ALiEM ReSCu Peds - Case 2: Cardiac Tamponade - Learning Objectives', 'CC BY-NC-SA 4.0', 'aliem-rescu-peds-2021', 'hash_005');
