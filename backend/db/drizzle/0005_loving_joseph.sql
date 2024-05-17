CREATE TABLE IF NOT EXISTS "media_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer,
	"user_id" integer,
	"media_url" text NOT NULL,
	"media_title" text NOT NULL,
	"media_author" text,
	"media_thumbnail" text,
	"media_duration" integer NOT NULL,
	"media_type" text NOT NULL,
	"media_id" text NOT NULL,
	"status" text DEFAULT 'pending',
	"requested_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stream_copilot_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer,
	"message" text NOT NULL,
	"role" text NOT NULL,
	"thought" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_requests" ADD CONSTRAINT "media_requests_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_requests" ADD CONSTRAINT "media_requests_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stream_copilot_messages" ADD CONSTRAINT "stream_copilot_messages_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
