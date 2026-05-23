CREATE TYPE "public"."employer_type" AS ENUM('individual', 'company', 'mass_hire', 'vip', 'ministry', 'ngo', 'startup');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('worker', 'employer', 'agent', 'ministry');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('pending', 'locked', 'released', 'disputed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."job_category" AS ENUM('plumbing', 'electrical', 'construction', 'carpentry', 'welding', 'painting', 'cleaning', 'cooking', 'gardening', 'moving', 'childcare', 'eldercare', 'driving', 'delivery', 'logistics', 'security', 'bodyguard', 'it_tech', 'finance_admin', 'legal', 'healthcare', 'education', 'engineering', 'agriculture', 'livestock', 'fishing', 'hospitality', 'retail', 'events', 'arts_media', 'tailoring', 'hairdressing', 'manufacturing', 'other');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('requested', 'matched', 'funded', 'active', 'completed', 'rated', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('informal', 'formal', 'gig', 'short_run', 'contract', 'seasonal', 'professional', 'emergency', 'remote', 'internship', 'mass_hire');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('flexible', 'normal', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('submitted', 'under_review', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."dispute_type" AS ENUM('work_not_done', 'work_poor_quality', 'payment_not_received', 'worker_no_show', 'scope_creep', 'safety_incident', 'other');--> statement-breakpoint
CREATE TYPE "public"."resolution_type" AS ENUM('refund', 'partial', 'release', 'redo');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'action', 'system');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"role" "user_role" NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"fayda_id" text,
	"fayda_verified" boolean DEFAULT false NOT NULL,
	"birth_date" text,
	"trust_score" integer DEFAULT 400 NOT NULL,
	"wallet_balance" integer DEFAULT 0 NOT NULL,
	"rating_sum" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"completed_jobs" integer DEFAULT 0 NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"hourly_rate" integer,
	"is_available" boolean DEFAULT true NOT NULL,
	"cv_url" text,
	"commission_rate" integer DEFAULT 200,
	"employer_type" "employer_type",
	"org_name" text,
	"org_license" text,
	"mass_hire_quota" integer,
	"is_vip" boolean DEFAULT false NOT NULL,
	"ministry_code" text,
	"api_key" text,
	"location" jsonb DEFAULT 'null'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"worker_id" uuid,
	"agent_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"job_type" "job_type" DEFAULT 'gig' NOT NULL,
	"category" "job_category" NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"requirements" jsonb DEFAULT '[]'::jsonb,
	"status" "job_status" DEFAULT 'requested' NOT NULL,
	"price" integer NOT NULL,
	"worker_amount" integer NOT NULL,
	"platform_fee" integer NOT NULL,
	"agent_commission" integer NOT NULL,
	"tax" integer NOT NULL,
	"location" jsonb NOT NULL,
	"is_remote" boolean DEFAULT false NOT NULL,
	"urgency" "urgency" DEFAULT 'normal' NOT NULL,
	"scheduled_at" timestamp,
	"duration_days" integer,
	"worker_count" integer DEFAULT 1 NOT NULL,
	"workers_filled" integer DEFAULT 0 NOT NULL,
	"escrow_status" "escrow_status" DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"ai_generated" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"external_ref" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"raised_by" uuid NOT NULL,
	"dispute_type" "dispute_type" NOT NULL,
	"description" text NOT NULL,
	"preferred_resolution" "resolution_type" NOT NULL,
	"evidence_notes" text,
	"status" "dispute_status" DEFAULT 'submitted' NOT NULL,
	"resolution" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disputes_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"rater_id" uuid NOT NULL,
	"rated_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"participants" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_rooms_job_id_unique" UNIQUE("job_id")
);
