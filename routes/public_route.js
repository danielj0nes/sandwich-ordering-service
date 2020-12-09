/**
 * File to define the API route handlers for the public login and registration functionality.
 * This code was provided via the initial project template
 * @module routes/public_route
 * @author Mark Tyers + Daniel Jones
 */
import Router from 'koa-router'
import Accounts from '../modules/accounts.js'

const router = new Router()
const dbName = 'website.db'
const ownerId = 4
/**
 * The Sandwich Ordering Service home page.
 * @name Home Page
 * @route {GET} /
 */
router.get('/', async ctx => {
	try {
		if(ctx.hbs.authorised) {
			return ctx.redirect('/menu?msg=you are logged in')
		} else {
			return ctx.redirect('login?msg=you need to log in')
		}
	} catch(err) {
		await ctx.render('error', ctx.hbs)
	}
})

/**
 * The user registration page.
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => await ctx.render('register'))

/**
 * The script to process new user registrations.
 * @name Register Script
 * @route {POST} /register
 */
router.post('/register', async ctx => {
	const account = await new Accounts(dbName)
	try {
		// call the functions in the module
		await account.register(ctx.request.body.user, ctx.request.body.pass, ctx.request.body.email)
		ctx.redirect(`/login?msg=new user "${ctx.request.body.user}" added, you need to log in`)
	} catch(err) {
		console.log(err)
		ctx.hbs.msg = err.message
		ctx.hbs.body = ctx.request.body
		console.log(ctx.hbs)
		await ctx.render('register', ctx.hbs)
	} finally {
		await account.close()
	}
})

/**
 * The user login page.
 * @name Login Page
 * @route {GET} /login
 */
router.get('/login', async ctx => {
	console.log(ctx.hbs)
	await ctx.render('login', ctx.hbs)
})

/**
 * The script to process a login event.
 * @name Login Script
 * @route {POST} /login
 */
router.post('/login', async ctx => {
	const account = await new Accounts(dbName)
	ctx.hbs.body = ctx.request.body
	try {
		const body = ctx.request.body
		const id = await account.login(body.user, body.pass)
		ctx.session.authorised = true
		ctx.session.user = body.user
		ctx.session.userid = id
		let referrer = body.referrer
		if (ctx.session.userid === ownerId) referrer = body.referrer || '/orders'
		else referrer = body.referrer || '/menu'
		return ctx.redirect(`${referrer}?msg=you are now logged in...`)
	} catch(err) {
		ctx.hbs.msg = err.message
		await ctx.render('login', ctx.hbs)
	} finally {
		await account.close()
	}
})

/**
 * The script to process a logout event
 * @name Logout Script
 * @route {GET} /logout
 */
router.get('/logout', async ctx => {
	ctx.session.authorised = null
	delete ctx.session.user
	delete ctx.session.userid
	ctx.redirect('/?msg=you are now logged out')
})

/* Export the router (which includes the associated methods) for use in routes.js */
export default router
