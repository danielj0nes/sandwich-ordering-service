/**
 * File to define the API route handlers for the checkout.
 * @module routes/checkout_route
 * @author Daniel Jones
 */
import Router from 'koa-router'

const prefix = '/checkout'
const router = new Router({ prefix: prefix })
// const dbName = 'website.db'

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/checkout')
	await next()
}

router.use(checkAuth)
router.post('/', checkout)

/**
 * Fetches menu data using helper functions defined in the menu module
 * Checks whether the client is logged in as the owner or as a customer, renders seperate pages accordingly
 * @param {object} ctx - json object containing the request and associated headers
 */
async function checkout(ctx) {
	let data = ctx.request.body
	data = JSON.parse(data.userorder)
	console.log(data)
	return ctx.redirect('/menu')
}

/** Export the router (which includes the associated methods) for use in routes.js */
export default router
