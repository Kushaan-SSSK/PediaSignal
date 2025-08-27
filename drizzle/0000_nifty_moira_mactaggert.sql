CREATE TABLE "chat_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"parent_message" text NOT NULL,
	"ai_response" text NOT NULL,
	"risk_level" text NOT NULL,
	"recommended_action" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kb_passages" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"stage" integer NOT NULL,
	"section" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"text" text NOT NULL,
	"embedding" jsonb,
	"source_citation" text NOT NULL,
	"license" text DEFAULT 'CC BY-NC-SA 4.0' NOT NULL,
	"document_id" text NOT NULL,
	"passage_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kb_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"version" text NOT NULL,
	"checksum" text NOT NULL,
	"document_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "misinfo_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source" text NOT NULL,
	"platform" text NOT NULL,
	"risk_score" real NOT NULL,
	"category" text NOT NULL,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"case_type" text NOT NULL,
	"stage" integer DEFAULT 1 NOT NULL,
	"vitals" jsonb NOT NULL,
	"interventions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_explanations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"evidence_sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"objective_hits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'medical_student' NOT NULL,
	"first_name" text,
	"last_name" text,
	"profile_image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "xray_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"filename" text NOT NULL,
	"image_data" text NOT NULL,
	"abuse_likelihood" real NOT NULL,
	"fracture_type" text,
	"explanation" text NOT NULL,
	"confidence_score" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xray_analyses" ADD CONSTRAINT "xray_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;