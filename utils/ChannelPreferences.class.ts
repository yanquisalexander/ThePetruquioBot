export enum FieldTypes {
    BOOLEAN = "boolean",
    TEXT = "text",
    INPUT = "input",
    CHANNEL_POINT = "channel_point",
    NUMBER = "number",
    LIST = "list",
}

export class ChannelPreferences {
    botMuted?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    useStreamerAccount?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    shoutoutPresentation?: {
        value: string;
        field_type: FieldTypes.TEXT;

    };
    enableCommunityMap?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    enableAnimatedPins?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    enableGreetings?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    enableTranslations?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    enableFollowAlerts?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    followAlertMessages?: {
        value: string[];
        field_type: FieldTypes.LIST;
    };
    mapCommandMessage?: {
        value: string;
        field_type: FieldTypes.TEXT;
    };
    enableRaidAlerts?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    raidAlertMessage?: {
        value: string;
        field_type: FieldTypes.TEXT;
    };
    minRaidViewers?: {
        value: number;
        field_type: FieldTypes.NUMBER;
    };
    enableLiveNotification?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    liveNotificationMessage?: {
        value: string;
        field_type: FieldTypes.TEXT;
    };
    enableShoutout?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    autoDisableEmoteOnly?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    enableFirstRanking?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    firstRankingRewardId?: {
        value: string;
        field_type: FieldTypes.CHANNEL_POINT;
    };
    firstRankingRedeemedMessage?: {
        value: string;
        field_type: FieldTypes.TEXT;
    };
    showSongRequestsOnMap?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
    };
    canvasSize?: {
        value: string;
        field_type: FieldTypes.INPUT;
    };
    values?: any;
};


export const defaultChannelPreferences: ChannelPreferences = {
    botMuted: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    useStreamerAccount: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    shoutoutPresentation: {
        value: "",
        field_type: FieldTypes.TEXT,
    },
    enableCommunityMap: {
        value: true,
        field_type: FieldTypes.BOOLEAN,
    },
    enableAnimatedPins: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    enableGreetings: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    enableTranslations: {
        value: true,
        field_type: FieldTypes.BOOLEAN,
    },
    enableFollowAlerts: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    followAlertMessages: {
        value: [],
        field_type: FieldTypes.LIST,
    },
    mapCommandMessage: {
        value: "",
        field_type: FieldTypes.TEXT,
    },
    enableRaidAlerts: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    raidAlertMessage: {
        value: "",
        field_type: FieldTypes.TEXT,
    },
    minRaidViewers: {
        value: 0,
        field_type: FieldTypes.NUMBER,
    },
    enableLiveNotification: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    liveNotificationMessage: {
        value: "",
        field_type: FieldTypes.TEXT,
    },
    enableShoutout: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    autoDisableEmoteOnly: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    enableFirstRanking: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    firstRankingRewardId: {
        value: "",
        field_type: FieldTypes.CHANNEL_POINT,
    },
    firstRankingRedeemedMessage: {
        value: "",
        field_type: FieldTypes.TEXT,
    },
    showSongRequestsOnMap: {
        value: false,
        field_type: FieldTypes.BOOLEAN,
    },
    canvasSize: {
        value: '600x800',
        field_type: FieldTypes.INPUT,
    },
};
