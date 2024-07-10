DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('copilot', 'streamer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "stream_copilot_messages" ADD COLUMN "role" "role" NOT NULL;