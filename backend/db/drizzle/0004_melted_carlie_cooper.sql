CREATE TABLE IF NOT EXISTS "uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"path" text NOT NULL,
	"size" integer NOT NULL,
	"mimetype" text NOT NULL,
	"uploaded_by" integer,
	"uploaded_at" timestamp DEFAULT now(),
	"key" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_users_twitch_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
