
import Router from 'koa-router'
import bodyParser from 'koa-body'

import publicRouter from './public_route.js'
import menuRouter from './menu_route.js'
import profileRouter from './profile_route.js'

const mainRouter = new Router()
mainRouter.use(bodyParser({multipart: true}))

const nestedRoutes = [publicRouter, menuRouter, profileRouter]
for (const router of nestedRoutes) {
	mainRouter.use(router.routes())
	mainRouter.use(router.allowedMethods())
}

export default mainRouter
