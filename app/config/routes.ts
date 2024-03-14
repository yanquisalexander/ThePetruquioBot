import { Router } from 'express'
import AccountsController from '../controllers/Accounts.controller'
import Passport from '../../lib/Passport'
import ChannelsController from '../controllers/Channels.controller'
import AdminController from '../controllers/Admin.controller'
import WorldMapController from '../controllers/WorldMap.controller'
import StatsController from '../controllers/Stats.controller'
import CommandsController from '../controllers/Commands.controller'
import CommunitiesController from '../controllers/Communities.controller'
import CommunityBooksController from '../controllers/CommunityBooks.controller'
import WorkflowsController from '../controllers/Workflows.controller'
import CommunityWallController from '../controllers/CommunityWall.controller'
import ExtrasController from '../controllers/Extras.controller'
import WidgetsController from '../controllers/Widgets.controller'
import DecksController from '../controllers/Decks.controller'
import { createDashboardRouter } from '@/app/config/routes/dashboard.router'
import { createSubscriptionsHooksRouter } from '@/app/config/routes/subscriptions-hooks.router'
import { createTwitchToolsRouter } from '@/app/config/routes/twitch-tools.router'
import { createBillingRouter } from '@/app/config/routes/billing.router'

const router = Router()

const authMiddleware = Passport.middleware

router.use('/dashboard', authMiddleware, createDashboardRouter())

router.get('/ping', (req, res) => {
  res.status(200).send('PONG')
})

/*
    This router don't have middleware, it receives data from LemonSqueezy and updates the user's subscription via Webhooks
*/
router.use('/subscriptions-hooks', createSubscriptionsHooksRouter())
router.use('/twitch-tools', createTwitchToolsRouter())
router.use('/billing', authMiddleware, createBillingRouter())

router.post('/accounts/getToken', AccountsController.getToken)
router.post('/accounts/token', AccountsController.getToken)

router.get('/accounts/me', authMiddleware, AccountsController.currentUser)

router.get('/accounts/session', authMiddleware, AccountsController.currentSession)
router.get('/accounts/login', AccountsController.startLoginFlow)
router.delete('/accounts/session', authMiddleware, AccountsController.destroySession)

router.get('/account', authMiddleware, AccountsController.getAccount)
router.get('/account/greetings', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.getGreetingsData)
router.post('/account/generate-api-token', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.generateApiToken)
router.get('/account/messages', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.getMessages)
router.get('/external-accounts/:provider/link', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.linkExternalAccount)
router.get('/external-accounts/:provider/callback', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.linkExternalAccountCallback)
router.post('/external-accounts/:provider/unlink', Passport.getPassport().authenticate('jwt', { session: false }), AccountsController.unlinkExternalAccount)

router.get('/channel/preferences', Passport.getPassport().authenticate('jwt', { session: false }), ChannelsController.getPreferences)
router.put('/channel/preferences', Passport.getPassport().authenticate('jwt', { session: false }), ChannelsController.updatePreferences)
router.get('/channel/commands', Passport.getPassport().authenticate('jwt', { session: false }), CommandsController.getCommands)
router.put('/channel/commands/:commandId', Passport.getPassport().authenticate('jwt', { session: false }), CommandsController.editCommand)
router.post('/channel/commands', Passport.getPassport().authenticate('jwt', { session: false }), CommandsController.createCommand)
router.delete('/channel/commands/:commandId', Passport.getPassport().authenticate('jwt', { session: false }), CommandsController.deleteCommand)
router.get('/channel/twitch-channel-points', Passport.getPassport().authenticate('jwt', { session: false }), ChannelsController.getTwitchChannelsPoints)

router.get('/channel/extras/got-talent/judges', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.getGotTalentJudges)
router.post('/channel/extras/got-talent/judges', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.addGotTalentJudge)
router.delete('/channel/extras/got-talent/judges', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.removeGotTalentJudge)
router.post('/channel/extras/got-talent/clear-crosses', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.clearGotTalentCrosses)
router.put('/channel/extras/got-talent/update-name', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.updateJudgeName)
router.put('/channel/extras/got-talent/clear-cross', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.clearGotTalentCross)
router.post('/channel/extras/got-talent/reload-overlay', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.reloadGotTalentOverlay)
router.put('/channel/extras/got-talent/update-positions', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.updateJudgesOrder)

router.get('/webhooks/:user_api_token', WorkflowsController.processIncomingRequest)
router.post('/webhooks/:user_api_token', WorkflowsController.processIncomingRequest)
router.post('/workflows', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.createWorkflow)
router.get('/workflows', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.getWorkflows)
router.put('/workflows/:event_type', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.updateWorkflow)
router.delete('/workflows/:event_type', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.deleteWorkflow)
router.get('/workflows/logs', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.getLogs)
router.delete('/workflows/logs/:log_id', Passport.getPassport().authenticate('jwt', { session: false }), WorkflowsController.deleteLog)

router.post('/channel/widgets', Passport.getPassport().authenticate('jwt', { session: false }), WidgetsController.createWidget)
router.get('/channel/widgets', Passport.getPassport().authenticate('jwt', { session: false }), WidgetsController.getWidgets)
router.get('/channel/widgets/:widgetId', Passport.getPassport().authenticate('jwt', { session: false }), WidgetsController.getWidget)
router.put('/channel/widgets/:widgetId', Passport.getPassport().authenticate('jwt', { session: false }), WidgetsController.updateWidget)

router.get('/channel/community/shoutouts', Passport.getPassport().authenticate('jwt', { session: false }), CommunitiesController.getShoutouts)
router.post('/channel/community/shoutouts', Passport.getPassport().authenticate('jwt', { session: false }), CommunitiesController.createShoutout)
router.put('/channel/community/shoutouts', Passport.getPassport().authenticate('jwt', { session: false }), CommunitiesController.updateShoutout)
router.delete('/channel/community/shoutouts/:targetStreamerId', Passport.getPassport().authenticate('jwt', { session: false }), CommunitiesController.deleteShoutout)

router.get('/admin/dashboard', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.dashboardIndex)
router.get('/admin/users', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.getUsers)
router.post('/admin/users/:userId/impersonate', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.impersonateUser)
router.delete('/admin/users/impersonate', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.stopImpersonatingUser)
router.post('/admin/users/:userId/refresh-token', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.refreshUserToken)

router.post('/admin/console', Passport.getPassport().authenticate('jwt', { session: false }), AdminController.remoteConsole)

router.get('/worldmap/:channelName/splash.png', WorldMapController.getSplashEmoteset)
router.get('/worldmap/:channelName/splash.json', WorldMapController.getSplashEmoteset)
router.get('/worldmap/:channelName', WorldMapController.getWorldMap)
router.get('/worldmap/:channelName/user-card/:username', WorldMapController.getUserCard)

router.get('/audits', Passport.getPassport().authenticate('jwt', { session: false }), ChannelsController.getAudits)

router.get('/community-books/:channelName', CommunityBooksController.getCommunityBooks)
router.get('/community-books/:channelName/:communityBookId', CommunityBooksController.getCommunityBook)
router.post('/community-books/:channelName', CommunityBooksController.createCommunityBook)

router.get('/community-walls/:channelName', CommunityWallController.findByChannel)

router.get('/rankings/:channelName', ChannelsController.getFirstRanking)

router.get('/stats', StatsController.getStats)
router.get('/stats/uptime', StatsController.uptime)
router.get('/stats/live-channels', StatsController.getLiveChannels)
router.get('/stats/joined-channels', StatsController.getJoinedChannels)
router.get('/stats/processed-messages', StatsController.getProcessedMessages)

router.get('/extras/:channelName/got-talent', ExtrasController.getGotTalentConfig)
router.post('/extras/:channelName/got-talent/red-button', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.addCrossTalentJudge)
router.post('/extras/:channelName/got-talent/golden-buzzer', Passport.getPassport().authenticate('jwt', { session: false }), ExtrasController.goldenBuzzerTalentJudge)

router.get('/widgets/:widgetId', WidgetsController.getWidgetConfig)

// Decks

router.get('/decks', authMiddleware, DecksController.getDecks)
router.get('/decks/:deckId', authMiddleware, DecksController.getDeckById)
router.post('/decks', authMiddleware, DecksController.createDeck)
router.put('/decks/:deckId', authMiddleware, DecksController.updateDeck)
router.delete('/decks/:deckId', authMiddleware, DecksController.deleteDeckById)

/* static async updateDeckButtonById(req: Request, res: Response): Promise<Response> {
    const deckButtonId = req.params.deckButtonId as unknown as number;
    const deckPageId = req.params.deckPageId as unknown as number;
    const deckId = req.params.deckId as unknown as number;
 */

router.post('/decks/:deckId/page', authMiddleware, DecksController.createDeckPage)
router.delete('/decks/:deckId/page', authMiddleware, DecksController.deleteDeckPageById)
router.post('/decks/:deckId/:deckPageId/button', authMiddleware, DecksController.createDeckButton)
router.delete('/decks/:deckId/:deckPageId/button/:deckButtonId', authMiddleware, DecksController.deleteDeckButtonById)
router.put('/decks/:deckId/:deckPageId/button/:deckButtonId', authMiddleware, DecksController.updateDeckButtonById)
router.put('/decks/:deckId/:deckPageId/buttons/update-positions', authMiddleware, DecksController.updateDeckButtonsOrder)

export default router
