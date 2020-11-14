
import Router from 'koa-router'
import Contacts from '../modules/contacts.js'

const router = new Router({ prefix: '/sos' })
const dbName = 'website.db'

async function checkAuth(ctx, next) {
	console.log('secure router middleware')
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/sos')
	await next()
}

router.use(checkAuth)

router.get('/', async ctx => {
	const contacts = await new Contacts(dbName)
	try {
		const records = await contacts.all()
		console.log(records)
		ctx.hbs.records = records
		await ctx.render('sos', ctx.hbs)
	} catch(err) {
		console.log(err)
		ctx.hbs.error = err.message
		await ctx.render('error', ctx.hbs)
	}
})

export default router
