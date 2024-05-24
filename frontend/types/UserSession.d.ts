export interface UserSession {
    username:                 string;
    twitchID:                 number;
    email:                    string;
    displayName:              string;
    avatar:                   string;
    admin:                    boolean;
    birthday:                 Date;
    session:                  Session;
    channel:                  Channel;
    linkedAccounts:           LinkedAccount[];
    systemToken:              boolean;
    unread_notifications_count: number;
    is_patron:                 boolean;
    token:                    string;
}

export interface Channel {
    twitchID:    number;
    autoJoin:    boolean;
    preferences: Preferences;
    user:        User;
}

export interface Preferences {
    botMuted:                    BotMuted;
    useStreamerAccount:          BotMuted;
    shoutoutPresentation:        FirstRankingRedeemedMessage;
    enableCommunityMap:          BotMuted;
    enableAnimatedPins:          BotMuted;
    enableGreetings:             BotMuted;
    enableSmartAssistant:        EnableSmartAssistant;
    smartAssistantPrompt:        CommunityWallCanvasSize;
    enableTranslations:          BotMuted;
    enableFollowAlerts:          BotMuted;
    followAlertMessages:         FollowAlertMessages;
    mapCommandMessage:           FirstRankingRedeemedMessage;
    enableRAIDAlerts:            BotMuted;
    raidAlertMessage:            FirstRankingRedeemedMessage;
    minRAIDViewers:              FirstRankingRedeemedMessage;
    enableLiveNotification:      BotMuted;
    liveNotificationMessage:     FirstRankingRedeemedMessage;
    enableShoutout:              BotMuted;
    enableFirstRanking:          BotMuted;
    firstRankingRewardID:        FirstRankingRedeemedMessage;
    firstRankingRedeemedMessage: FirstRankingRedeemedMessage;
    showSongRequestsOnMap:       BotMuted;
    communityWallCanvasSize:     CommunityWallCanvasSize;
}

export interface BotMuted {
    value:           boolean;
    fieldType:       FieldType;
    patreonRequired: boolean;
}

export enum FieldType {
    Boolean = "boolean",
}

export interface CommunityWallCanvasSize {
    value:                                  string;
    fieldType:                              string;
    patreonRequired?:                       boolean;
    newFeature:                             boolean;
    communityWallCanvasSizePatreonRequired: boolean;
    paidFeature?:                           boolean;
}

export interface EnableSmartAssistant {
    value:           boolean;
    fieldType:       FieldType;
    newFeature:      boolean;
    paidFeature:     boolean;
    patreonRequired: boolean;
}

export interface FirstRankingRedeemedMessage {
    value:           string;
    fieldType:       string;
    patreonRequired: boolean;
}

export interface FollowAlertMessages {
    value:           any[];
    fieldType:       string;
    patreonRequired: boolean;
}

export interface User {
    username:    string;
    twitchID:    number;
    email:       string;
    displayName: string;
    avatar:      string;
    admin:       boolean;
    birthday:    Date;
}

export interface LinkedAccount {
    accountID: string;
    provider:  string;
    metadata:  Metadata | null;
    expiresAt: null;
}

export interface Metadata {
    id:                    string;
    email?:                string;
    flags?:                number;
    avatar?:               string;
    banner?:               null;
    locale?:               string;
    provider:              string;
    username:              string;
    verified?:             boolean;
    fetchedAt?:            Date;
    accessToken?:          string;
    globalName?:           string;
    mfaEnabled?:           boolean;
    accentColor?:          number;
    bannerColor?:          string;
    premiumType?:          number;
    publicFlags?:          number;
    discriminator?:        string;
    avatarDecorationData?: null;
    raw?:                  string;
    name?:                 Name;
    json?:                 JSON;
    emails?:               Email[];
    photos?:               Photo[];
    aboutMe?:              null;
    created?:              Date;
    accounts?:             any[];
    profileURL?:           string;
    displayName?:          string;
}

export interface Email {
    value:    string;
    primary:  boolean;
    verified: boolean;
}

export interface JSON {
    data:  Data;
    links: Links;
}

export interface Data {
    id:         string;
    type:       string;
    attributes: Attributes;
}

export interface Attributes {
    url:             string;
    about:           null;
    email:           string;
    vanity:          string;
    created:         Date;
    fullName:        string;
    imageURL:        string;
    lastName:        string;
    thumbURL:        string;
    firstName:       string;
    isEmailVerified: boolean;
}

export interface Links {
    self: string;
}

export interface Name {
    formatted:  string;
    givenName:  string;
    familyName: string;
}

export interface Photo {
    type:     string;
    value:    string;
    primary?: boolean;
}

export interface Session {
    userID:             number;
    sessionID:          number;
    impersonatedUserID: null;
    createdAt:          Date;
}
