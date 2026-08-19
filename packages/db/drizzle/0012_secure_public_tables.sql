ALTER TABLE "public"."content_notification_deliveries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."content_performance_snapshots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."organization_inquiries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."content_operation_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."content_channel_tasks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."content_notification_deliveries" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."content_performance_snapshots" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."organization_inquiries" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."content_operation_items" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."content_channel_tasks" FROM "anon", "authenticated";
