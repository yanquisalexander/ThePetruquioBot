export enum FieldTypes {
    BOOLEAN = "boolean",
    TEXT = "text",
    INPUT = "input",
    CHANNEL_POINT = "channel_point",
    NUMBER = "number",
    LIST = "list",
}

type ChannelPreference<T> = {
    value: T;
    field_type: FieldTypes;
};

type ChannelPreferences = {
    [K in keyof typeof defaultChannelPreferences]: ChannelPreference<typeof defaultChannelPreferences[K]['value']>;
};

const createChannelPreference = <T>(value: T, field_type: FieldTypes, patreonRequired: boolean = false, newFeature: boolean = false) => ({ value, field_type, patreonRequired: patreonRequired, newFeature });

const createDefaultChannelPreferences = () => ({
    botMuted: createChannelPreference(false, FieldTypes.BOOLEAN),
    useStreamerAccount: createChannelPreference(false, FieldTypes.BOOLEAN),
    shoutoutPresentation: createChannelPreference("", FieldTypes.TEXT),
    enableCommunityMap: createChannelPreference(true, FieldTypes.BOOLEAN),
    enableAnimatedPins: createChannelPreference(false, FieldTypes.BOOLEAN),
    enableGreetings: createChannelPreference(false, FieldTypes.BOOLEAN),
    enableSmartAssistant: createChannelPreference(false, FieldTypes.BOOLEAN, true, true),
    smartAssistantPrompt: createChannelPreference("You are a helpful assistant!", FieldTypes.TEXT, false, true),
    enableTranslations: createChannelPreference(true, FieldTypes.BOOLEAN),
    enableFollowAlerts: createChannelPreference(false, FieldTypes.BOOLEAN),
    followAlertMessages: createChannelPreference([], FieldTypes.LIST),
    mapCommandMessage: createChannelPreference("", FieldTypes.TEXT),
    enableRaidAlerts: createChannelPreference(false, FieldTypes.BOOLEAN),
    raidAlertMessage: createChannelPreference("", FieldTypes.TEXT),
    minRaidViewers: createChannelPreference(0, FieldTypes.NUMBER),
    enableLiveNotification: createChannelPreference(false, FieldTypes.BOOLEAN),
    liveNotificationMessage: createChannelPreference("", FieldTypes.TEXT),
    enableShoutout: createChannelPreference(false, FieldTypes.BOOLEAN),
    enableFirstRanking: createChannelPreference(false, FieldTypes.BOOLEAN),
    firstRankingRewardId: createChannelPreference("", FieldTypes.CHANNEL_POINT),
    firstRankingRedeemedMessage: createChannelPreference("", FieldTypes.TEXT),
    showSongRequestsOnMap: createChannelPreference(false, FieldTypes.BOOLEAN),
} as const);

const defaultChannelPreferences = createDefaultChannelPreferences();

export { defaultChannelPreferences as default, ChannelPreferences };
