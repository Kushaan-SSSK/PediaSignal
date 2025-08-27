CREATE TABLE "kb_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"query" text NOT NULL,
	"case_id" text,
	"stage" integer,
	"section" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passage_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"top_k" integer DEFAULT 10 NOT NULL,
	"response_time" integer,
	"cache_hit" boolean DEFAULT false,
	"evidence_sources" integer DEFAULT 0,
	"objective_hits" integer DEFAULT 0,
	"risk_flags" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "objective_coverage" (
	"id" serial PRIMARY KEY NOT NULL,
	"simulation_id" integer NOT NULL,
	"objective_id" text NOT NULL,
	"objective_text" text NOT NULL,
	"status" text DEFAULT 'not-met' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"evidence_sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"what_went_well" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"improvements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"time_to_complete" integer,
	"interventions_applied" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "kb_queries" ADD CONSTRAINT "kb_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objective_coverage" ADD CONSTRAINT "objective_coverage_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE no action ON UPDATE no action;