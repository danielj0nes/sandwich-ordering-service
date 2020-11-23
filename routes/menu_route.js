
import Router from 'koa-router'
import Menu from '../modules/menu.js'

const router = new Router({ prefix: '/menu' })
const dbName = 'website.db'
const ownerId = 4
const openingTime = 100

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/menu')
	await next()
}

router.use(checkAuth)

router.get('/', async ctx => {
	const menu = await new Menu(dbName)
	try {
		const categories = await menu.getCategories()
		const sandwiches = await menu.getByCategory('Sandwich')
		const snacks = await menu.getByCategory('Snack')
		const drinks = await menu.getByCategory('Drink')
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
		console.log(err)
		ctx.hbs.error = err.message
		await ctx.render('error', ctx.hbs)
	}
})

router.get('/edit', async ctx => {
	const menu = await new Menu(dbName)
	if (ctx.session.userid === ownerId) {
		const categories = await menu.getCategories()
		ctx.hbs.categories = categories
		await ctx.render('editmenu', ctx.hbs)
	} else {
		await ctx.render('error', ctx.hbs)
	}
})

router.post('/edit', async ctx => {
	const menu = await new Menu(dbName)
	try {
		ctx.request.body.account = ctx.session.userid
		if(ctx.request.files.picture.name) {
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
})

export default router
