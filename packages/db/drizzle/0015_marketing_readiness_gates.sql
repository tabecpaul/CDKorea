ALTER TABLE "marketing_content_versions" ADD COLUMN "duplicate_gate" varchar(16) DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_content_versions" ADD COLUMN "site_first_status" varchar(20) DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_content_versions" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "marketing_content_versions" ADD COLUMN "expected_article_identity" varchar(500);--> statement-breakpoint
ALTER TABLE "marketing_content_versions" ADD COLUMN "canonical_readback_status" varchar(16) DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_content_versions" ADD CONSTRAINT "marketing_content_versions_duplicate_gate_check" CHECK ("marketing_content_versions"."duplicate_gate" IN ('UNKNOWN', 'PASS', 'REVISE', 'BLOCKED'));--> statement-breakpoint
ALTER TABLE "marketing_content_versions" ADD CONSTRAINT "marketing_content_versions_site_first_status_check" CHECK ("marketing_content_versions"."site_first_status" IN ('UNKNOWN', 'NOT_PUBLISHED', 'PUBLISHED', 'FAILED'));--> statement-breakpoint
ALTER TABLE "marketing_content_versions" ADD CONSTRAINT "marketing_content_versions_canonical_readback_status_check" CHECK ("marketing_content_versions"."canonical_readback_status" IN ('UNKNOWN', 'PASS', 'FAILED'));--> statement-breakpoint
CREATE TABLE "marketing_canonical_readbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"version_id" integer NOT NULL,
	"canonical_url" text NOT NULL,
	"http_status" integer,
	"expected_article_identity" varchar(500) NOT NULL,
	"observed_title" varchar(1000),
	"observed_identity" varchar(1000),
	"result" varchar(16) NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_canonical_readbacks_result_check" CHECK ("marketing_canonical_readbacks"."result" IN ('PASS', 'FAILED'))
);
--> statement-breakpoint
ALTER TABLE "marketing_canonical_readbacks" ADD CONSTRAINT "marketing_canonical_readbacks_content_id_marketing_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."marketing_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_canonical_readbacks" ADD CONSTRAINT "marketing_canonical_readbacks_version_id_marketing_content_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."marketing_content_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketing_canonical_readbacks_version_checked_idx" ON "marketing_canonical_readbacks" USING btree ("version_id", "checked_at");--> statement-breakpoint
CREATE INDEX "marketing_canonical_readbacks_content_checked_idx" ON "marketing_canonical_readbacks" USING btree ("content_id", "checked_at");--> statement-breakpoint
ALTER TABLE "public"."marketing_canonical_readbacks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."marketing_canonical_readbacks" FROM "anon", "authenticated";
