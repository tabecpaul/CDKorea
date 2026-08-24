CREATE TABLE "marketing_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"snapshot_hash" varchar(64) NOT NULL,
	"approved_by" varchar(80),
	"approved_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer,
	"version_id" integer,
	"schedule_id" integer,
	"actor" varchar(80) NOT NULL,
	"action" varchar(80) NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_channel_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"version_id" integer NOT NULL,
	"channel" varchar(24) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"mode" varchar(16) NOT NULL,
	"utm_url" text NOT NULL,
	"status" varchar(32) DEFAULT 'approval_pending' NOT NULL,
	"published_post_id" varchar(200),
	"published_url" text,
	"published_at" timestamp with time zone,
	"last_error_code" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" varchar(24) NOT NULL,
	"account_id" varchar(200) NOT NULL,
	"account_name" varchar(200) NOT NULL,
	"status" varchar(32) DEFAULT 'unverified' NOT NULL,
	"permissions" jsonb,
	"token_expires_at" timestamp with time zone,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_content_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL,
	"position" integer NOT NULL,
	"drive_file_id" varchar(160) NOT NULL,
	"filename" varchar(240) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_content_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"version" integer NOT NULL,
	"status" varchar(32) DEFAULT 'proposal' NOT NULL,
	"naver_body" text,
	"meta_caption" text,
	"threads_posts" jsonb,
	"drive_folder_id" varchar(160),
	"canva_design_url" text,
	"approved_snapshot_hash" varchar(64),
	"created_by" varchar(40) NOT NULL,
	"revision_note" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(240) NOT NULL,
	"campaign_key" varchar(120) NOT NULL,
	"cta_kind" varchar(40) NOT NULL,
	"naver_category" varchar(80),
	"current_version_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_publish_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer NOT NULL,
	"publish_key" varchar(180) NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" varchar(24) DEFAULT 'started' NOT NULL,
	"error_code" varchar(100),
	"response_metadata" jsonb,
	"platform_post_id" varchar(200),
	"published_url" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "marketing_approvals" ADD CONSTRAINT "marketing_approvals_version_id_marketing_content_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."marketing_content_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_audit_logs" ADD CONSTRAINT "marketing_audit_logs_content_id_marketing_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."marketing_contents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_audit_logs" ADD CONSTRAINT "marketing_audit_logs_version_id_marketing_content_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."marketing_content_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_audit_logs" ADD CONSTRAINT "marketing_audit_logs_schedule_id_marketing_channel_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."marketing_channel_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_channel_schedules" ADD CONSTRAINT "marketing_channel_schedules_content_id_marketing_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."marketing_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_channel_schedules" ADD CONSTRAINT "marketing_channel_schedules_version_id_marketing_content_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."marketing_content_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_content_assets" ADD CONSTRAINT "marketing_content_assets_version_id_marketing_content_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."marketing_content_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_content_versions" ADD CONSTRAINT "marketing_content_versions_content_id_marketing_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."marketing_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_contents" ADD CONSTRAINT "marketing_contents_current_version_id_marketing_content_versions_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."marketing_content_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_publish_attempts" ADD CONSTRAINT "marketing_publish_attempts_schedule_id_marketing_channel_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."marketing_channel_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketing_approvals_version_created_idx" ON "marketing_approvals" USING btree ("version_id","created_at");--> statement-breakpoint
CREATE INDEX "marketing_approvals_status_created_idx" ON "marketing_approvals" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "marketing_audit_logs_content_created_idx" ON "marketing_audit_logs" USING btree ("content_id","created_at");--> statement-breakpoint
CREATE INDEX "marketing_audit_logs_action_created_idx" ON "marketing_audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_channel_schedules_version_channel_unique" ON "marketing_channel_schedules" USING btree ("version_id","channel");--> statement-breakpoint
CREATE INDEX "marketing_channel_schedules_status_scheduled_idx" ON "marketing_channel_schedules" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "marketing_channel_schedules_content_created_idx" ON "marketing_channel_schedules" USING btree ("content_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_connections_channel_account_unique" ON "marketing_connections" USING btree ("channel","account_id");--> statement-breakpoint
CREATE INDEX "marketing_connections_status_checked_idx" ON "marketing_connections" USING btree ("status","checked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_content_assets_version_position_unique" ON "marketing_content_assets" USING btree ("version_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_content_assets_version_drive_file_unique" ON "marketing_content_assets" USING btree ("version_id","drive_file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_content_versions_content_version_unique" ON "marketing_content_versions" USING btree ("content_id","version");--> statement-breakpoint
CREATE INDEX "marketing_content_versions_content_created_idx" ON "marketing_content_versions" USING btree ("content_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_contents_slug_unique" ON "marketing_contents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "marketing_contents_campaign_updated_idx" ON "marketing_contents" USING btree ("campaign_key","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_publish_attempts_publish_key_unique" ON "marketing_publish_attempts" USING btree ("publish_key");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_publish_attempts_schedule_attempt_unique" ON "marketing_publish_attempts" USING btree ("schedule_id","attempt_number");--> statement-breakpoint
CREATE INDEX "marketing_publish_attempts_schedule_started_idx" ON "marketing_publish_attempts" USING btree ("schedule_id","started_at");
--> statement-breakpoint
ALTER TABLE "public"."marketing_contents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."marketing_content_versions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."marketing_content_assets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."marketing_channel_schedules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."marketing_approvals" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."marketing_publish_attempts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."marketing_connections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."marketing_audit_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_contents" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_content_versions" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_content_assets" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_channel_schedules" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_approvals" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_publish_attempts" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_connections" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_audit_logs" FROM "anon", "authenticated";
