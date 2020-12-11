/**
 * File to define the API route handlers for the checkout.
 * @module routes/checkout_route
 * @author Daniel Jones
 */
import Router from 'koa-router'
import Order from '../modules/orders.js'
import Accounts from '../modules/accounts.js'

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
		await order.addToCheckout(data)
		return ctx.redirect('/checkout')
	} catch(err) {
		ctx.hbs.errormessage = `An error has occured - ${err.message}`
		await ctx.render('error', ctx.hbs)
	} finally {
		order.close()
	}
}
/**
 * Checks that the currently logged in user has contact information available prior to placing an order
 * @param {Object} ctx - JSON object containing the request and associated headers
 * @return {Boolean} true upon valid or existing address, false if not
 */
async function checkAddress(ctx) {
	const profile = await new Accounts(dbName)
	const userProfile = await profile.getById(ctx.session.userid)
	for (const [key, detail] of Object.entries(userProfile[0])) {
		if (key !== 'addressLine2' && (detail === null || detail === '')) { // Since address line 2 is optional, ignore
			return false
		}
	}
	return true
}
/**
 * Fetches menu data using helper functions defined in the menu module
 * Checks the current time against the openingTime variable to ensure that orders cannot be placed after a certain time
 * @param {Object} ctx - JSON object containing the request and associated headers
 */
async function order(ctx) {
	const order = await new Order(dbName)
	try {
		if (!await checkAddress(ctx)) return ctx.redirect('/menu?msg=you need to add contact information\
														  via the profile page&referrer=/checkout')
		const userOrder = await order.getCheckout(ctx.session.userid)
		if (!userOrder) return ctx.redirect('/menu?msg=you need to add items to your order\
											before checking out&referrer=/checkout')
		else {
			ctx.hbs.order = userOrder
			await ctx.render('checkout', ctx.hbs)
		}
	} catch(err) {
		ctx.hbs.errormessage = `An error has occured - ${err.message}`
		await ctx.render('error', ctx.hbs)
	} finally {
		order.close()
	}
}

/** Export the router (which includes the associated methods) for use in routes.js */
export default router
