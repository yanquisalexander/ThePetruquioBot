export interface User {
  username: string
  twitchId: number
  email: string
  displayName: string
  avatar: string
  admin: boolean
  birthday: string
  session: Session
  channel: Channel
  token: string
}

export interface Session {
  userId: number
  sessionId: number
  impersonatedUserId: any
  createdAt: string
}

export interface Channel {
  twitchId: number
  autoJoin: boolean
  preferences: Preferences
  user: User
}

export interface Preferences {
  botMuted: BotMuted
  shoutoutPresentation: ShoutoutPresentation
  enableCommunityMap: EnableCommunityMap
  enableAnimatedPins: EnableAnimatedPins
  enableGreetings: EnableGreetings
  enableTranslations: EnableTranslations
  enableFollowAlerts: EnableFollowAlerts
  followAlertMessages: FollowAlertMessages
  mapCommandMessage: MapCommandMessage
  enableRaidAlerts: EnableRaidAlerts
  raidAlertMessage: RaidAlertMessage
  minRaidViewers: MinRaidViewers
  enableLiveNotification: EnableLiveNotification
  liveNotificationMessage: LiveNotificationMessage
  enableShoutout: EnableShoutout
  autoDisableEmoteOnly: AutoDisableEmoteOnly
  enableFirstRanking: EnableFirstRanking
  firstRankingRewardId: FirstRankingRewardId
  firstRankingRedeemedMessage: FirstRankingRedeemedMessage
  showSongRequestsOnMap: ShowSongRequestsOnMap
  canvasSize: CanvasSize
  listenToEvents: ListenToEvents
  enableTransitions: EnableTransitions
  enableObsControl: EnableObsControl
  obsWebsocketUrl: ObsWebsocketUrl
  obsWebsocketPassword: ObsWebsocketPassword
}

export interface BotMuted {
  value: boolean
  field_type: string
}

export interface ShoutoutPresentation {
  value: string
  field_type: string
}

export interface EnableCommunityMap {
  value: boolean
  field_type: string
}

export interface EnableAnimatedPins {
  value: boolean
  field_type: string
}

export interface EnableGreetings {
  value: boolean
  field_type: string
}

export interface EnableTranslations {
  value: boolean
  field_type: string
}

export interface EnableFollowAlerts {
  value: boolean
  field_type: string
}

export interface FollowAlertMessages {
  value: any[]
  field_type: string
}

export interface MapCommandMessage {
  value: string
  field_type: string
}

export interface EnableRaidAlerts {
  value: boolean
  field_type: string
}

export interface RaidAlertMessage {
  value: string
  field_type: string
}

export interface MinRaidViewers {
  value: string
  field_type: string
}

export interface EnableLiveNotification {
  value: boolean
  field_type: string
}

export interface LiveNotificationMessage {
  value: string
  field_type: string
}

export interface EnableShoutout {
  value: boolean
  field_type: string
}

export interface AutoDisableEmoteOnly {
  value: boolean
  field_type: string
}

export interface EnableFirstRanking {
  value: boolean
  field_type: string
}

export interface FirstRankingRewardId {
  value: string
  field_type: string
}

export interface FirstRankingRedeemedMessage {
  value: string
  field_type: string
}

export interface ShowSongRequestsOnMap {
  value: boolean
  field_type: string
}

export interface CanvasSize {
  value: string
  field_type: string
}

export interface ListenToEvents {
  value: boolean
  field_type: string
}

export interface EnableTransitions {
  value: boolean
  field_type: string
}

export interface EnableObsControl {
  value: boolean
  field_type: string
}

export interface ObsWebsocketUrl {
  value: string
  field_type: string
}

export interface ObsWebsocketPassword {
  value: string
  field_type: string
}