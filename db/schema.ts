import { sql } from 'drizzle-orm'
import { integer, text, timestamp, pgTable, boolean, serial, jsonb, primaryKey, uuid } from 'drizzle-orm/pg-core'

export const UsersTable = pgTable('users', {
  twitch_id: integer('twitch_id').primaryKey(),
  username: text('username').notNull(),
  email: text('email'),
  display_name: text('display_name'),
  admin: boolean('admin').default(false),
  avatar: text('avatar'),
  birthday_date: timestamp('birthday_date'),
  api_token: text('api_token')
})

export const ChannelsTable = pgTable('channels', {
  id: serial('id').primaryKey(),
  preferences: jsonb('preferences').default('{}'),
  auto_join: boolean('auto_join').default(false),
  twitch_id: integer('twitch_id').references(() => UsersTable.twitch_id)
})

export const AuditsTable = pgTable('audits', {
  id: serial('id').primaryKey(),
  channel_id: integer('channel_id').references(() => ChannelsTable.twitch_id),
  user_id: integer('user_id').references(() => UsersTable.twitch_id),
  type: text('type').notNull(),
  data: jsonb('data').default('{}'),
  created_at: timestamp('created_at').default(sql.raw('now()'))
})

export const CommandsTable = pgTable('commands', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  channel_id: integer('channel_id').references(() => ChannelsTable.twitch_id),
  permissions: jsonb('permissions').default('[]'),
  description: text('description').notNull(),
  preferences: jsonb('preferences').default('{}'),
  response: text('response').notNull(),
  enabled: boolean('enabled').default(true),
  created_at: timestamp('created_at').default(sql.raw('now()')),
  updated_at: timestamp('updated_at').default(sql.raw('now()'))
})

export const ExternalAccountsTable = pgTable('external_accounts', {
  // Unique user_id, provider, account_id
  user_id: integer('user_id').references(() => UsersTable.twitch_id),
  provider: text('provider').notNull(),
  account_id: text('account_id').notNull(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  metadata: jsonb('metadata').default('{}')
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.user_id, table.provider, table.account_id] })
  }
})

export const GreetingsTable = pgTable('greetings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => UsersTable.twitch_id),
  channel: integer('channel').references(() => ChannelsTable.twitch_id),
  last_seen: timestamp('last_seen').default(sql.raw('now()')),
  shoutouted_at: timestamp('shoutouted_at').default(sql.raw('now()')),
  enabled: boolean('enabled').default(true)
})

export const MessagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  sender_id: integer('sender_id').references(() => UsersTable.twitch_id),
  channel_id: integer('channel_id').references(() => ChannelsTable.twitch_id),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').default(sql.raw('now()')),
  message_id: text('message_id').notNull()
})

export const RedemptionHistoryTable = pgTable('redemption_history', {
  id: serial('id').primaryKey(),
  event_id: text('event_id').notNull(),
  reward_id: text('reward_id').notNull(),
  reward_name: text('reward_name').notNull(),
  reward_cost: integer('reward_cost').notNull(),
  reward_icon: text('reward_icon').notNull(),
  redemption_date: timestamp('redemption_date').default(sql.raw('now()')),
  message: text('message'),
  user_id: integer('user_id').references(() => UsersTable.twitch_id),
  channel_id: integer('channel_id').references(() => ChannelsTable.twitch_id)
})

export const RevokedApiTokensTable = pgTable('revoked_api_tokens', {
  id: serial('id').primaryKey(),
  api_token: text('api_token').notNull(),
  revoked_at: timestamp('revoked_at').default(sql.raw('now()'))
})

export const SessionsTable = pgTable('sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => UsersTable.twitch_id),
  impersonated_user_id: integer('impersonated_user_id').references(() => UsersTable.twitch_id),
  device_info: jsonb('device_info').default('{}'),
  location_info: jsonb('location_info').default('{}'),
  created_at: timestamp('created_at').default(sql.raw('now()'))
})

export const ShoutoutsTable = pgTable('shoutouts', {
  id: serial('id').primaryKey(),
  messages: text('messages').array(),
  updated_at: timestamp('updated_at').default(sql.raw('now()')),
  user_id: integer('user_id').references(() => UsersTable.twitch_id),
  created_at: timestamp('created_at').default(sql.raw('now()')),
  enabled: boolean('enabled').default(true),
  channel_id: integer('channel_id').references(() => ChannelsTable.twitch_id)
})

export const SpectatorLocationsTable = pgTable('spectator_locations', {
  user_id: integer('user_id').references(() => UsersTable.twitch_id).primaryKey(),
  latitude: text('latitude'),
  longitude: text('longitude'),
  location: text('location'),
  country_code: text('country_code')
})

export const UserTokensTable = pgTable('user_tokens', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => UsersTable.twitch_id),
  token_data: jsonb('token_data').notNull()
})

export const WorldMapsTable = pgTable('world_maps', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => UsersTable.twitch_id),
  channel_id: integer('channel_id').references(() => ChannelsTable.twitch_id),
  masked: boolean('masked').default(false),
  show_on_map: boolean('show_on_map').default(true),
  pin_emote: text('pin_emote'),
  pin_message: text('pin_message')
})

export const WorkflowsTable = pgTable('workflows', {
  id: serial('id').primaryKey(),
  channel_id: integer('channel_id').references(() => ChannelsTable.twitch_id),
  event_type: text('event_type').notNull(),
  script: text('script').notNull(),
  created_at: timestamp('created_at').default(sql.raw('now()')),
  updated_at: timestamp('updated_at').default(sql.raw('now()'))
})

export const WorkflowLogsTable = pgTable('workflow_logs', {
  id: serial('id').primaryKey(),
  execution_id: uuid('execution_id').notNull(),
  event_type: text('event_type').notNull(),
  script: text('script').notNull(),
  success: boolean('success'),
  channel_id: integer('channel_id').references(() => ChannelsTable.twitch_id),
  created_at: timestamp('created_at').default(sql.raw('now()')),
  updated_at: timestamp('updated_at').default(sql.raw('now()')),
  execution_log: text('execution_log')
})
