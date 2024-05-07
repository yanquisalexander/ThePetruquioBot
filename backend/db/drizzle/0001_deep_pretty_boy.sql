CREATE TABLE IF NOT EXISTS "custom_widgets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"channel_id" integer NOT NULL,
	"widget_name" text NOT NULL,
	"custom_html" text,
	"custom_css" text,
	"custom_js" text,
	"properties" json DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_widgets" ADD CONSTRAINT "custom_widgets_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
