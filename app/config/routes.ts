import { Router } from "express";
import AccountsController from "../controllers/Accounts.controller";
import Passport from "../../lib/Passport";
import ChannelsController from "../controllers/Channels.controller";
import AdminController from "../controllers/Admin.controller";
import WorldMapController from "../controllers/WorldMap.controller";
import StatsController from "../controllers/Stats.controller";
import CommandsController from "../controllers/Commands.controller";
import CommunitiesController from "../controllers/Communities.controller";
import DashboardController from "../controllers/Dashboard.controller";
import CommunityBooksController from "../controllers/CommunityBooks.controller";
import WorkflowsController from "../controllers/Workflows.controller";
import Twitch from "../modules/Twitch.module";
import { Bot } from "../../bot";
import CommunityWallController from "../controllers/CommunityWall.controller";
import ExtrasController from "../controllers/Extras.controller";


const router = Router();

router.post('/accounts/getToken', AccountsController.getToken);

router.get('/accounts/me', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.currentUser);

router.get('/accounts/session', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.currentSession);
router.get('/accounts/login',  AccountsController.startLoginFlow);
router.delete('/accounts/session', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.destroySession);

router.get('/account/greetings', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.getGreetingsData);
router.get('/account/messages', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.getMessages);

router.get('/dashboard', Passport.getPassport().authenticate('jwt', { session: false }), DashboardController.index);
router.post('/dashboard/join', Passport.getPassport().authenticate('jwt', { session: false }), DashboardController.join);
router.post('/dashboard/part', Passport.getPassport().authenticate('jwt', { session: false }), DashboardController.part);
router.post('/dashboard/send-message', Passport.getPassport().authenticate('jwt', { session: false }), DashboardController.sendMessageAsBot);
router.post('/dashboard/toggle-mute', Passport.getPassport().authenticate('jwt', { session: false }), DashboardController.toggleMute);

router.get('/channel/preferences', Passport.getPassport().authenticate('jwt', { session: false }), ChannelsController.getPreferences);
router.put('/channel/preferences', Passport.getPassport().authenticate('jwt', { session: false }), ChannelsController.updatePreferences);
router.get('/channel/commands', Passport.getPassport().authenticate('jwt', { session: false }), CommandsController.getCommands);
router.put('/channel/commands/:commandId', Passport.getPassport().authenticate('jwt', { session: false }), CommandsController.editCommand);
router.post('/channel/commands', Passport.getPassport().authenticate('jwt', { session: false }), CommandsController.createCommand);
router.delete('/channel/commands/:commandId', Passport.getPassport().authenticate('jwt', { session: false }), CommandsController.deleteCommand);
router.get('/channel/twitch-channel-points', Passport.getPassport().authenticate('jwt', { session: false }), ChannelsController.getTwitchChannelsPoints);

router.get('/channel/extras/got-talent/judges', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.getGotTalentJudges);
router.post('/channel/extras/got-talent/judges', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.addGotTalentJudge);
router.delete('/channel/extras/got-talent/judges', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.removeGotTalentJudge);

router.post('/channel/workflows', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.createWorkflow);
router.get('/channel/workflows', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.getWorkflows);
router.put('/channel/workflows/:event_type', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.updateWorkflow);
router.delete('/channel/workflows/:event_type', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.deleteWorkflow);


router.get('/channel/community/shoutouts', Passport.getPassport().authenticate('jwt', { session: false }), CommunitiesController.getShoutouts);
router.post('/channel/community/shoutouts', Passport.getPassport().authenticate('jwt', { session: false }), CommunitiesController.createShoutout);
router.put('/channel/community/shoutouts', Passport.getPassport().authenticate('jwt', { session: false }), CommunitiesController.updateShoutout);
router.delete('/channel/community/shoutouts/:targetStreamerId', Passport.getPassport().authenticate('jwt', { session: false }), CommunitiesController.deleteShoutout);

router.get('/admin/dashboard', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.dashboardIndex);
router.get('/admin/users', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.getUsers);
router.post('/admin/users/:userId/impersonate', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.impersonateUser);
router.delete('/admin/users/impersonate', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.stopImpersonatingUser);

router.post('/admin/console', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.remoteConsole);

router.get('/worldmap/:channelName/splash.png', WorldMapController.getSplashEmoteset);
router.get('/worldmap/:channelName/splash.json', WorldMapController.getSplashEmoteset);
router.get('/worldmap/:channelName', WorldMapController.getWorldMap);
router.get('/worldmap/:channelName/user-card/:username', WorldMapController.getUserCard);



router.get('/community-books/:channelName', CommunityBooksController.getCommunityBooks);
router.get('/community-books/:channelName/:communityBookId', CommunityBooksController.getCommunityBook);
router.post('/community-books/:channelName', CommunityBooksController.createCommunityBook);

router.get('/community-walls/:channelName', CommunityWallController.findByChannel);

router.get('/rankings/:channelName', ChannelsController.getFirstRanking);

router.get('/stats', StatsController.getStats);
router.get('/stats/uptime', StatsController.uptime);
router.get('/stats/live-channels', StatsController.getLiveChannels);
router.get('/stats/joined-channels', StatsController.getJoinedChannels);
router.get('/stats/processed-messages', StatsController.getProcessedMessages);

router.get('/extras/:channelName/got-talent', ExtrasController.getGotTalentConfig);
router.post('/extras/:channelName/got-talent/red-button', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.addCrossTalentJudge);
router.post('/extras/:channelName/got-talent/golden-buzzer', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.goldenBuzzerTalentJudge);



export default router;