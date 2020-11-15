
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

export default router
