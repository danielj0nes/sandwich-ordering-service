/**
 * File to define the API route handlers for checkout functionality.
 * @module routes/checkout_route
 * @author Daniel Jones
 */
import Router from 'koa-router'
import Order from '../modules/orders.js'

const prefix = '/checkout'
const router = new Router({ prefix: prefix })
const dbName = 'website.db'

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/checkout')
	await next()
}

router.use(checkAuth)
router.get('/', retrieveOrder)
router.post('/', sendToCheckout)

/**
 * Retrieve an order or several orders associated to a user that have not yet been marked as complete
 * @param {Object} ctx - JSON object containing the request and associated headers
 */
async function retrieveOrder(ctx) {
	const order = await new Order(dbName)
	try {
		const userOrder = await order.getById(ctx.session.userid)
		if (userOrder === false) { // If the order contents are blank, redirect the user and prompt them to add items
			return ctx.redirect('/menu?msg=you need to add items to your order before checking out&referrer=/checkout')
		} else {
			ctx.hbs.order = userOrder
			await ctx.render('checkout', ctx.hbs)
		}
	} catch(err) {
		console.log(err)
	} finally {
		order.close()
	}
}
/**
 * Inserts order data obtained via a POST request using helper functions defined in the orders module
 * @param {Object} ctx - JSON object containing the request and associated headers
 * @return {Object} redirect object that sends the user to the checkout page upon successful POST
 */
async function sendToCheckout(ctx) {
	const order = await new Order(dbName)
	let data = ctx.request.body
	try {
		data = JSON.parse(data.userorder)
		data['userid'] = ctx.session.userid
		await order.add(data)
		return ctx.redirect('/checkout')
	} catch(err) {
		console.log(err)
	} finally {
		order.close()
	}
}

/** Export the router (which includes the associated methods) for use in routes.js */
export default router
