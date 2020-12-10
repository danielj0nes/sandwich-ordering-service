/**
 * File to define the API route handlers for order functionality.
 * @module routes/checkout_route
 * @author Daniel Jones
 */
import Router from 'koa-router'
import Order from '../modules/orders.js'

const prefix = '/orders'
const router = new Router({ prefix: prefix })
const dbName = 'website.db'
const ownerId = 4
const ownerOrderTime = 11 // Change this to 11 for complete stage1-part3 functionality

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/checkout')
	await next()
}

router.use(checkAuth)
router.post('/', processOrder)
router.get('/', checkOrder)

/**
 * Updates a checked out order by checking the status and proceeding accordingly
 * Status is true for confirmation of order and false for removal of checked out order
 * @param {Object} ctx - JSON object containing the request and associated headers
 * @return {Object} redirect object that sends the user to the checkout page upon successful POST
 */
async function processOrder(ctx) {
	const order = await new Order(dbName)
	let data = ctx.request.body
	try {
		data = JSON.parse(data.orderinstruction)
		if (await order.processOrder(data)) return ctx.redirect('/orders')
		else return ctx.redirect('/checkout')
	} catch(err) {
		console.log(err)
	} finally {
		order.close()
	}
}
/**
 * Upon GET request, check the user ID and render the appropriate page and date accordingly
 * In the case of the owner, render a page with all orders and information
 * In the case of the user, render a page with all their order
 * @param {Object} ctx - JSON object containing the request and associated headers
 * @return {Object} redirect object that sends the user to the checkout page upon successful POST
 */
async function checkOrder(ctx) {
	const order = await new Order(dbName)
	if (ctx.session.userid === ownerId) {
		const currentHours = new Date().getHours()
		if (currentHours > ownerOrderTime) {
			ctx.hbs.orders = await order.getAll()
			console.log('It is before 11AM - come back past 11.')
			await ctx.render('owner_orders', ctx.hbs)
		} else await ctx.render('error', ctx.hbs)
	} else {
		ctx.hbs.order = await order.getById(ctx.session.userid)
		await ctx.render('user_orders', ctx.hbs)
	}
}

/** Export the router (which includes the associated methods) for use in routes.js */
export default router
