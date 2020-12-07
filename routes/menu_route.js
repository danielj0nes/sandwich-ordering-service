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
const openingTime = 100

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
 * Checks whether the client is logged in as the owner or as a customer, renders seperate pages accordingly
 * @param {object} ctx - json object containing the request and associated headers
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
		if(ctx.session.userid === ownerId) await ctx.render('owner_menu', ctx.hbs)
		else {
			const currentHours = new Date().getHours()
			if(currentHours < openingTime) await ctx.render('user_menu', ctx.hbs)
			else await ctx.render('error', ctx.hbs)
		}
	} catch(err) {
		await ctx.render('error', ctx.hbs)
	}
}
/**
 * Renders the edit menu page providing the owner is the one logged in
 * Passes over the menu categories so that one can be selected when adding a new item to the menu
 * @param {object} ctx - json object containing the request and associated headers
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
 * Handle the posting of data from the edit menu page
 * @param {object} ctx - json object containing the request and associated headers
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
		return ctx.redirect('/menu?msg=new item added')
	} catch(err) {
		console.log(err)
		await ctx.render('error', ctx.hbs)
	} finally {
		menu.close()
	}
}
/** Export the router (which includes the associated methods) for use in routes.js */
export default router
