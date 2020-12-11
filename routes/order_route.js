/**
 * File to define the API route handlers for order functionality.
 * @module routes/order_route
 * @author Daniel Jones
 */
import Router from 'koa-router'
import Order from '../modules/orders.js'

const prefix = '/orders'
const router = new Router({ prefix: prefix })
const dbName = 'website.db'
const ownerId = 4
/**
 * @const {integer} ownerOrderTime - The hour at which the owner can view active orders
 */
const ownerOrderTime = 11 // Change this to 11 for complete stage1-part3 functionality

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/checkout')
	await next()
}

router.use(checkAuth)
router.post('/', processOrder)
router.post('/:id([0-9]{1,})', markDelivered)
router.get('/', checkOrder)
router.get('/:id([0-9]{1,})', getOrderById)
router.get('/history', orderHistory)

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
		const orderInfo = await order.processOrder(data)
		if (orderInfo !== false) {
			await order.emailUser(orderInfo[0])
			return ctx.redirect('/orders')
		} else return ctx.redirect('/checkout')
	} catch(err) {
		ctx.hbs.errormessage = `An error has occured - ${err.message}`
		await ctx.render('error', ctx.hbs)
	} finally {
		order.close()
	}
}
/**
 * Upon GET request, checks the user ID and renders the appropriate page and date accordingly
 * In the case of the owner, render a page with all orders and information
 * In the case of the user, render a page with all their specific orders
 * @param {Object} ctx - JSON object containing the request and associated headers
 * @return {Object} redirect object that sends the user to the checkout page upon successful POST
 */
async function checkOrder(ctx) {
	const order = await new Order(dbName)
	if (ctx.session.userid === ownerId) {
		const currentHours = new Date().getHours()
		if (currentHours > ownerOrderTime) { // Check if it's past 11 AM
			ctx.hbs.orders = await order.getAll('In progress')
			ctx.hbs.itemcount = await order.getCount()
			await ctx.render('owner_orders', ctx.hbs)
		} else {
			ctx.hbs.errormessage = 'Please come back after 11:00 AM'
			await ctx.render('error', ctx.hbs)
		}
	} else {
		ctx.hbs.order = await order.getById(ctx.session.userid)
		await ctx.render('user_orders', ctx.hbs)
	}
}
/**
 * Stage 2 part 3 functionality
 * Upon GET request to orders + a valid id number, renders order_details.handlebars
 * To view the order information, requires the associated userid or the owner id
 * @param {Object} ctx - JSON object containing the request and associated headers
 */
async function getOrderById(ctx) {
	const id = ctx.params.id
	const order = await new Order(dbName)
	try {
		const orderDetails = await order.getByOrderId(id)
		if (orderDetails[0].userid === ctx.session.userid || ctx.session.userid === ownerId) {
			ctx.hbs.orderdetails = orderDetails[0]
			await ctx.render('order_details', ctx.hbs)
		} else {
			ctx.hbs.errormessage = `User id ${ctx.session.userid} does not match with ${id}`
			await ctx.render('error', ctx.hbs)
		}
	} catch(err) {
		ctx.hbs.errormessage = `Error - most likely invalid ID supplied as argument - ${err.message}`
		await ctx.render('error', ctx.hbs)
	}
}
/**
 * Stage 2 part 3 functionality
 * Upon post request to specific order id, updates the status of the order
 * i.e allows the owner to mark a delivery as delivered
 * @param {Object} ctx - JSON object containing the request and associated headers
 * @return {Object} redirect object that sends the owner back to the orders page upon successful POST
 */
async function markDelivered(ctx) {
	const order = await new Order(dbName)
	let data = ctx.request.body
	try {
		data = JSON.parse(data.updatedstatus)
		await order.updateStatus(data)
		return ctx.redirect('/orders')
	} catch(err) {
		ctx.hbs.errormessage = `An error has occured - ${err.message}`
		await ctx.render('error', ctx.hbs)
	} finally {
		order.close()
	}
}
/**
 * Upon GET request to ../history shows previously completed orders to the owner
 * @param {Object} ctx - JSON object containing the request and associated headers
 */
async function orderHistory(ctx) {
	const order = await new Order(dbName)
	if (ctx.session.userid === ownerId) {
		ctx.hbs.orders = await order.getAll('Delivered')
		ctx.hbs.itemcount = await order.getCount()
		await ctx.render('order_history', ctx.hbs)
	} else {
		ctx.hbs.errormessage = `Attempt to access order history by user id ${ctx.session.userid}`
		await ctx.render('error', ctx.hbs)
	}
}
/** Export the router (which includes the associated methods) for use in routes.js */
export default router
