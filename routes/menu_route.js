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
 * @const {number} - The hour at which the menu becomes available to the customer
 */
const openingTime = 100 // Change this to 11

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
 * Checks the current time against the openingTime variable to ensure that orders cannot be placed after a certain time
 * @param {Object} JSON object containing the request and associated headers
 */
async function getMenu(ctx) {
	const menu = await new Menu(dbName)
	try {
		const components = {categories: await menu.getCategories(), sandwiches: await menu.getByCategory('Sandwich'),
						   snacks: await menu.getByCategory('Snack'), drinks: await menu.getByCategory('Drink')}
		const {categories, sandwiches, snacks, drinks} = components
		ctx.hbs.categories = categories
		ctx.hbs.sandwiches = sandwiches
		ctx.hbs.snacks = snacks
		ctx.hbs.drinks = drinks
		const currentHours = new Date().getHours()
		if(currentHours < openingTime) await ctx.render('user_menu', ctx.hbs)
		else await ctx.render('error', ctx.hbs)
	} catch(err) {
		await ctx.render('error', ctx.hbs)
	}
}
/**
 * Renders the edit menu page providing the owner is the one logged in
 * Passes over the menu categories so that one can be selected when adding a new item to the menu
 * @param {object} JSON object containing the request and associated headers
 */
async function editMenu(ctx) {
	const menu = await new Menu(dbName)
	if (ctx.session.userid === ownerId) {
		const categories = await menu.getCategories()
		ctx.hbs.categories = categories
		await ctx.render('editmenu', ctx.hbs)
	} else {
		await ctx.render('error', ctx.hbs)
	}
}
/**
 * Handle adding a new item to the menu via a POST request on the menu/edit page
 * @param {Object} JSON object containing the request and associated headers
 * @return {Object} returns a redirect object, notifying the user that the item has been added, after the new item has been added
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
		console.log(err)
		await ctx.render('error', ctx.hbs)
	} finally {
		menu.close()
	}
}
/* Export the router (which includes the associated methods) for use in routes.js */
export default router
