/**
 * File to define the API route handlers for order functionality.
 * @module routes/checkout_route
 * @author Daniel Jones
 */
import Router from 'koa-router'
import Order from '../modules/orders.js'
import fs from 'fs' // To read email crecentials from emailconfig
import nodemailer from 'nodemailer'

const prefix = '/orders'
const router = new Router({ prefix: prefix })
const dbName = 'website.db'
const ownerId = 4
const ownerOrderTime = -11 // Change this to 11 for complete stage1-part3 functionality
const emailCredentials = fs.readFileSync('emailconfig.txt', 'utf8').toString().split('\n')

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/checkout')
	await next()
}

router.use(checkAuth)
router.post('/', processOrder)
router.get('/', checkOrder)
router.get('/:id([0-9]{1,})', getOrderById)

/**
 * Stage 2 part 2 functionality
 * Given data as provided by processOrder, sends an email containing:
 * Order number, items, prices, total price, QR code of order number
 * @param {Object} content - JSON object containing headers and data pertaining to the order and user
 */
async function emailUser(data) {
	const subject = `ORDER CONFIRMED - ORDER NO. ${data.orderNumber}`
	const body = `Order number: ${data.orderNumber}\nItems: ${data.itemPrices}\nTotal: £${data.price}\n`
	const mailOptions = {
		from: emailCredentials[0], to: data.email, subject: subject, text: body,
		attachments: [{filename: `order_${data.orderNumber}.png`, path: `${data.qrcode}`}]
	}
	const mailer = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: emailCredentials[0],
			pass: emailCredentials[1]
		}
	})
	mailer.sendMail(mailOptions, async(err, emaildata) => {
		if (err) console.log(err)
		else console.log(`Email sent to ${data.email} response: ${emaildata.response}`)
	})
}
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
			emailUser(orderInfo[0])
			return ctx.redirect('/orders')
		} else return ctx.redirect('/checkout')
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
			ctx.hbs.itemcount = await order.getCount()
			await ctx.render('owner_orders', ctx.hbs)
		} else {
			console.log('It is before 11AM - come back past 11.')
			await ctx.render('error', ctx.hbs)
		}
	} else {
		ctx.hbs.order = await order.getById(ctx.session.userid)
		await ctx.render('user_orders', ctx.hbs)
	}
}

async function getOrderById(ctx) {
	const id = ctx.params.id
	const order = await new Order(dbName)
	try {
		const orderDetails = await order.getByOrderId(id)
		if (orderDetails[0].userid === ctx.session.userid || ctx.session.userid === ownerId) {
			ctx.hbs.orderdetails = orderDetails[0]
			console.log(orderDetails[0])
			await ctx.render('order_details', ctx.hbs)
		} else {
			console.log(`User id ${ctx.session.userid} does not match with ${id}`)
			await ctx.render('error', ctx.hbs)
		}
	} catch(err) {
		console.log(`Error - most likely invalid ID supplied as argument - ${err}`)
		await ctx.render('error', ctx.hbs)
	}
}

/** Export the router (which includes the associated methods) for use in routes.js */
export default router
