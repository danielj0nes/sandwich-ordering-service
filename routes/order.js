
import Router from 'koa-router'
import Menu from '../modules/menu.js'

const router = new Router({ prefix: '/order' })
const dbName = 'website.db'

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/order')
	await next()
}

router.use(checkAuth)

router.get('/', async ctx => {
	const menu = await new Menu(dbName)
	try {
		const records = await menu.all()
		console.log(records)
		ctx.hbs.records = records
		await ctx.render('order', ctx.hbs)
	} catch(err) {
		console.log(err)
		ctx.hbs.error = err.message
		await ctx.render('error', ctx.hbs)
	}
})
router.get('/edit-menu',  async ctx => {
	await ctx.render('editmenu', ctx.hbs)
})

router.post('/edit-menu', async ctx => {
	const menu = await new Menu(dbName)
	try {
		ctx.request.body.account = ctx.session.userid
		if(ctx.request.files.picture.name) {
			ctx.request.body.filePath = ctx.request.files.picture.path
			ctx.request.body.fileName = ctx.request.files.picture.name
			ctx.request.body.fileType = ctx.request.files.picture.type	
		}
		await menu.add(ctx.request.body)
		return ctx.redirect('/order?msg=new item added')
	} catch(err) {
		console.log(err)
		await ctx.render('error', ctx.hbs)
	} finally {
		menu.close()
	}
})

export default router
