
import Router from 'koa-router'
import Profile from '../modules/profile.js'

const router = new Router({ prefix: '/profile' })
const dbName = 'website.db'

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/menu')
	await next()
}

router.use(checkAuth)

router.get('/', async ctx => {
	const profile = await new Profile(dbName)
	try {
		const records = await profile.all(ctx.session.userid)
		ctx.hbs.records = records
		await ctx.render('profile', ctx.hbs)
	} catch(err) {
		console.log(err)
		ctx.hbs.error = err.message
		await ctx.render('error', ctx.hbs)
	}
})

router.post('/', async ctx => {
	const profile = await new Profile(dbName)
	try {
		ctx.request.body.account = ctx.session.userid
		await profile.add(ctx.request.body, ctx.session.userid)
		return ctx.redirect('/profile?msg=Profile updated')
	} catch(err) {
		console.log(err)
		await ctx.render('error', ctx.hbs)
	} finally {
		profile.close()
	}
})

export default router
