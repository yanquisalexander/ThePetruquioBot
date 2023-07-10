import { Router } from 'express'
import WorldMapRouter from './world-map.js'
import StatsRouter from './stats.js'
import RankingRouter from './ranking.js'
import DashboardRouter from './dashboard.js'
import AccountsRouter from './accounts.js'

let routes = Router()
let RouterMap = [
    {
        path: '/map',
        handler: WorldMapRouter
    },
    {
        path: '/stats',
        handler: StatsRouter
    },
    {
        path: '/rankings',
        handler: RankingRouter
    },
    {
        path: '/dashboard',
        handler: DashboardRouter
    },
    {
        path: '/accounts',
        handler: AccountsRouter
    },
    {
        path: '*',
        handler: (req, res, next) => {
            res.status(404).json({
                errors: [
                    "Apparently the requested URL or Resource could not be found 😿."
                ],
                error_type: "not_found"
            })
        }
    }
]


RouterMap.map(route => {
    routes.use(route.path, route.handler)
})


export default routes