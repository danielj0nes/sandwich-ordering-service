
import Router from 'koa-router'
import Menu from '../modules/menu.js'

const router = new Router({ prefix: '/menu' })
const dbName = 'website.db'

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/menu')
	await next()
}

router.use(checkAuth)

router.get('/', async ctx => {
	const menu = await new Menu(dbName)
	try {
		if(ctx.session.userid === 4) { // Check if the owner is logged in or not
			const records = await menu.all()
			console.log(records)
			ctx.hbs.records = records
			await ctx.render('owner_menu', ctx.hbs)
		} else {
			const records = await menu.all()
			console.log(records)
			ctx.hbs.records = records
			await ctx.render('user_menu', ctx.hbs)
		}
	} catch(err) {
		console.log(err)
		ctx.hbs.error = err.message
		await ctx.render('error', ctx.hbs)
	}
})
router.get('/edit', async ctx => {
	if (ctx.session.userid === 4) {
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
