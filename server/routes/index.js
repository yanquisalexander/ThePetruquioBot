import { Router } from 'express'
import WorldMapRouter from './world-map.js'

let routes = Router()
let RouterMap = [
    {
        path: '/map',
        handler: WorldMapRouter
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