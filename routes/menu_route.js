/**
 * File to define the API route handlers for the menu.
 * @module routes/menu_route
 * @author Daniel Jones
 */
import Router from 'koa-router'
import Menu from '../modules/menu.js'


const prefix = '/menu'
const router = new Router({ prefix: prefix })
const dbName = 'website.db'
const ownerId = 4
/**
 * @const {integer} userOpeningTime - The hour at which the menu becomes available to the customer
 */
const userOpeningTime = 11 // Change this to 11 for complete stage1-part2 functionality

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/menu')
	await next()
}

router.use(checkAuth)
router.get('/', getMenu)
router.get('/edit', editMenu)
router.post('/edit', updateMenu)

/**
 * Fetches menu data using helper functions defined in the menu module
 * Checks the current time against the userOpeningTime variable;ensure that orders cannot be placed after a certain time
 * @param {Object} ctx - JSON object containing the request and associated headers
 */
async function getMenu(ctx) {
	const menu = await new Menu(dbName)
	try {
		ctx.hbs.categories = await menu.getCategories()
		ctx.hbs.sandwiches = await menu.getByCategory('Sandwich')
		ctx.hbs.snacks = await menu.getByCategory('Snack')
		ctx.hbs.drinks = await menu.getByCategory('Drink')
		const currentHours = new Date().getHours()
		if(currentHours < userOpeningTime) await ctx.render('user_menu', ctx.hbs) // If it's before 11, user can order
		else {
			ctx.hbs.errormessage = 'It is past 11:00 AM - please try again tomorrow before 11:00 AM'
			await ctx.render('error', ctx.hbs)
		}
	} catch(err) {
		await ctx.render('error', ctx.hbs)
	}
}
/**
 * Renders the edit menu page providing the owner is the one logged in
 * Passes over the menu categories so that one can be selected when adding a new item to the menu
 * @param {object} ctx - JSON object containing the request and associated headers
 */
async function editMenu(ctx) {
	const menu = await new Menu(dbName)
	if (ctx.session.userid === ownerId) {
		const categories = await menu.getCategories()
		ctx.hbs.categories = categories
		await ctx.render('editmenu', ctx.hbs)
	} else {
		ctx.hbs.errormessage = 'You are not able to edit the menu'
		await ctx.render('error', ctx.hbs)
	}
}
/**
 * Handle adding a new item to the menu via a POST request on the menu/edit page
 * @param {Object} ctx - JSON object containing the request and associated headers
 * @return {Object} returns a redirect object notifying the user that the item has been added
 */
async function updateMenu(ctx) {
	const menu = await new Menu(dbName)
	try {
		ctx.request.body.account = ctx.session.userid
		if (ctx.request.files.picture.name) {
			ctx.request.body.filePath = ctx.request.files.picture.path
			ctx.request.body.fileName = ctx.request.files.picture.name
			ctx.request.body.fileType = ctx.request.files.picture.type
		}
		await menu.add(ctx.request.body)
		return ctx.redirect('/menu/edit?msg=new item added')
	} catch(err) {
		ctx.hbs.errormessage = `An error has occured - ${err.message}`
		await ctx.render('error', ctx.hbs)
	} finally {
		menu.close()
	}
}
/* Export the router (which includes the associated methods) for use in routes.js */
export default router
