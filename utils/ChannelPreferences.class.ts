enum FieldTypes {
    BOOLEAN = "boolean",
    TEXT = "text",
    CHANNEL_POINT = "channel_point",
    NUMBER = "number",
}

export class ChannelPreferences {
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
    enableTransitions?: {
        value: boolean;
        field_type: FieldTypes.BOOLEAN;
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
    values?: any;
};


export const defaultChannelPreferences: ChannelPreferences = {
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
    enableTransitions: {
        value: true,
        field_type: FieldTypes.BOOLEAN,
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
};
