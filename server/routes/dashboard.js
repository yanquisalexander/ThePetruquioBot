import { Router } from "express";
import passport from "../../lib/passport.js";
import Channel from "../../app/models/Channel.js";
import { AppClient, HelixClient } from "../../utils/twitch.js";
import UserToken from "../../app/models/UserToken.js";
import { ApiClient } from "@twurple/api";
import { StaticAuthProvider } from "@twurple/auth";
import { botJoinedChannels } from "../../memory_variables.js";
import { merge } from "lodash-es";
import { SETTINGS_MODEL } from "../../app/models/Channel.js";
import { subscribeToEvents } from "../boot-webserver.js";

const DashboardRouter = Router();

DashboardRouter.get("/bot-settings", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const channel = await Channel.getChannelByName(req.user.username);
    let settings = channel.settings;
    const HIDDEN_CONDITIONS = {
      live_notification_message: () => !settings.enable_live_notification.value,
      first_ranking_twitch_reward: () => !settings.enable_first_ranking.value,
      enable_conversation: () => !settings.enable_experimental_features.value,
      conversation_prompt: () => !settings.enable_experimental_features.value,
      enable_detoxify: () => !settings.enable_experimental_features.value,

    };

    // Agregar el campo 'hidden' a cada ajuste según las condiciones definidas
    for (const settingName in settings) {
      if (HIDDEN_CONDITIONS.hasOwnProperty(settingName)) {
        settings[settingName].hidden = HIDDEN_CONDITIONS[settingName]();
      }
    }
    res.json({
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      errors: [
        "Something went wrong while trying to get the bot settings."
      ],
      error_type: "internal_server_error"
    });
  }


})

DashboardRouter.post("/bot-settings", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const channel = await Channel.getChannelByName(req.user.username);
    const updatedSettings = req.body; // Supongamos que el cuerpo de la solicitud contiene un objeto con los ajustes modificados { key: value }

    // Iterar sobre cada ajuste modificado y actualizar solo la clave "value" en el objeto de ajustes del canal
    for (const key in updatedSettings) {
      if (channel.settings.hasOwnProperty(key) && typeof channel.settings[key] === 'object' && channel.settings[key].hasOwnProperty('value')) {
        channel.settings[key].value = updatedSettings[key];
      }
    }

    await subscribeToEvents(channel)

    // Guardar los cambios en la base de datos
    await channel.updateSettings();

    res.json({
      success: true,
      message: "Bot settings updated successfully."
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errors: [
        "Something went wrong while trying to update the bot settings."
      ],
      error_type: "internal_server_error"
    });
  }
});

DashboardRouter.get('/auditories', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const channel = await Channel.getChannelByName(req.user.username);
    const auditories = await channel.getAuditories();

    res.json({
      data: auditories
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errors: [
        "Something went wrong while trying to get the auditories."
      ],
      error_type: "internal_server_error"
    });
  }
});

DashboardRouter.get('/mod/channels', passport.authenticate('jwt', { session: false }), async (req, res) => {
  // Obtener canales donde el usuario es moderador
  try {
    const user = await AppClient.users.getUserByName(req.user.username);
    const token = await UserToken.findByUserId(req.user.id);
    const authProvider = new StaticAuthProvider(process.env.TWITCH_CLIENT_ID, token.accessToken);
    const TwitchClient = new ApiClient({
      authProvider
    })

    
    const moderatedChannels = await TwitchClient.moderation.getModerators(user);
    console.log(moderatedChannels.data);
    const channels = moderatedChannels.data.map(channel => channel.userDisplayName);
    res.json({
      data: channels
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errors: [
        "Something went wrong while trying to get the moderated channels."
      ],
      error_type: "internal_server_error"
    });
  }
});

DashboardRouter.get('/recommended-actions', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const channel = await Channel.getChannelByName(req.user.username);
    channel.settings = merge({}, SETTINGS_MODEL, channel.settings)

    const recommendedActions = [];

    if (channel.settings.enable_community_map.value === false) {
      recommendedActions.push({
        type: 'ENABLE_COMMUNITY_MAP',
      });
    }

    res.json({
      data: recommendedActions
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errors: [
        "Something went wrong while trying to get the recommended actions."
      ],
      error_type: "internal_server_error"
    });
  }
});


DashboardRouter.get('/bot-status', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const channel = await Channel.getChannelByName(req.user.username);
    const joinedAt = botJoinedChannels[`#${req.user.username}`];
    if (joinedAt) {
      res.json({
        data: {
          status: 'online',
          joined_at: joinedAt,
          muted: channel.settings.bot_muted.value
        }
      });
    }
    else {
      res.json({
        data: {
          status: 'offline',
          joined_at: null
        }
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errors: [
        "Something went wrong while trying to get the bot status."
      ],
      error_type: "internal_server_error"
    });
  }
});

DashboardRouter.get('/channel-point-rewards', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const channel = await Channel.getChannelByName(req.user.username);
    const rewardsData = await HelixClient.channelPoints.getCustomRewards(channel.twitch_id);
    let rewards = []
    rewardsData.map(reward => {
      rewards.push({
        id: reward.id,
        title: reward.title,
        icon: reward.getImageUrl(1),
        background_color: reward.backgroundColor,
      })
    })
    res.json({
      data: rewards
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errors: [
        "Something went wrong while trying to get the channel point rewards."
      ],
      error_type: "internal_server_error"
    });
  }
});



export default DashboardRouter;
