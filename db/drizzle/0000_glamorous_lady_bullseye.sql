CREATE TABLE IF NOT EXISTS "audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer,
	"user_id" integer,
	"type" text NOT NULL,
	"data" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"preferences" jsonb DEFAULT '{}',
	"auto_join" boolean DEFAULT false,
	"twitch_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"channel_id" integer,
	"permissions" jsonb DEFAULT '[]',
	"description" text NOT NULL,
	"preferences" jsonb DEFAULT '{}',
	"response" text NOT NULL,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_accounts" (
	"user_id" integer,
	"provider" text NOT NULL,
	"account_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	CONSTRAINT "external_accounts_user_id_provider_account_id_pk" PRIMARY KEY("user_id","provider","account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "greetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"channel" integer,
	"last_seen" timestamp DEFAULT now(),
	"shoutouted_at" timestamp DEFAULT now(),
	"enabled" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer,
	"channel_id" integer,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"message_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redemption_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"reward_id" text NOT NULL,
	"reward_name" text NOT NULL,
	"reward_cost" integer NOT NULL,
	"reward_icon" text NOT NULL,
	"redemption_date" timestamp DEFAULT now(),
	"message" text,
	"user_id" integer,
	"channel_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revoked_api_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_token" text NOT NULL,
	"revoked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"impersonated_user_id" integer,
	"device_info" jsonb DEFAULT '{}',
	"location_info" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shoutouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"messages" text[],
	"updated_at" timestamp DEFAULT now(),
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	"enabled" boolean DEFAULT true,
	"channel_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spectator_locations" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"latitude" text,
	"longitude" text,
	"location" text,
	"country_code" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"token_data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"twitch_id" integer PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"display_name" text,
	"admin" boolean DEFAULT false,
	"avatar" text,
	"birthday_date" timestamp,
	"api_token" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"execution_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"script" text NOT NULL,
	"success" boolean,
	"channel_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"execution_log" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer,
	"event_type" text NOT NULL,
	"script" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "world_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"channel_id" integer,
	"masked" boolean DEFAULT false,
	"show_on_map" boolean DEFAULT true,
	"pin_emote" text,
	"pin_message" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audits" ADD CONSTRAINT "audits_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channels" ADD CONSTRAINT "channels_twitch_id_users_twitch_id_fk" FOREIGN KEY ("twitch_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commands" ADD CONSTRAINT "commands_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_accounts" ADD CONSTRAINT "external_accounts_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "greetings" ADD CONSTRAINT "greetings_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "greetings" ADD CONSTRAINT "greetings_channel_channels_twitch_id_fk" FOREIGN KEY ("channel") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_twitch_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonated_user_id_users_twitch_id_fk" FOREIGN KEY ("impersonated_user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shoutouts" ADD CONSTRAINT "shoutouts_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shoutouts" ADD CONSTRAINT "shoutouts_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spectator_locations" ADD CONSTRAINT "spectator_locations_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflows" ADD CONSTRAINT "workflows_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "world_maps" ADD CONSTRAINT "world_maps_user_id_users_twitch_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "world_maps" ADD CONSTRAINT "world_maps_channel_id_channels_twitch_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("twitch_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
