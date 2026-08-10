CREATE TABLE "organization_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_name" varchar(160) NOT NULL,
	"organization_type" varchar(32) NOT NULL,
	"contact_name" varchar(60) NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"program_interests" text[] NOT NULL,
	"estimated_participants" integer,
	"message" varchar(1000),
	"privacy_agreed" boolean NOT NULL,
	"consent_version" varchar(32) NOT NULL,
	"utm_source" varchar(128),
	"utm_medium" varchar(128),
	"utm_campaign" varchar(128),
	"utm_content" varchar(128),
	"anonymous_id" varchar(64),
	"status" varchar(24) DEFAULT 'new' NOT NULL,
	"notification_email_status" varchar(16) DEFAULT 'pending' NOT NULL,
	"notification_email_error" varchar(80),
	"notification_email_id" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "organization_inquiries_status_created_idx" ON "organization_inquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "organization_inquiries_email_created_idx" ON "organization_inquiries" USING btree ("email","created_at");