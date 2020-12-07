/**
 * File to define the API route handlers for the checkout.
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
router.get('/', order)
router.post('/', sendToCheckout)

/**
 * Fetches order data using helper functions defined in the orders module
 * @param {object} ctx - json object containing the request and associated headers
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

async function order(ctx) {
	const order = await new Order(dbName)
	try {
		const userOrder = await order.getById(ctx.session.userid)
		if (userOrder === false) {
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

/** Export the router (which includes the associated methods) for use in routes.js */
export default router
