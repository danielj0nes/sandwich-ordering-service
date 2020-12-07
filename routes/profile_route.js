/**
 * File to define the API route handlers for a user's profile.
 * @module routes/profile_route
 * @author Daniel Jones
 */
import Router from 'koa-router'
import Profile from '../modules/profile.js'

const router = new Router({ prefix: '/profile' })
const dbName = 'website.db'

async function checkAuth(ctx, next) {
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/profile')
	await next()
}

router.use(checkAuth)
router.get('/', viewProfile)
router.get('/', updateProfile)

/**
 * Fetches the logged in user's profile data upon GET request using helper functions defined in the profile module
 * @param {Object} ctx - json object containing the request and associated headers
 */
async function viewProfile(ctx) {
	const profile = await new Profile(dbName)
	try {
		const records = await profile.getById(ctx.session.userid)
		ctx.hbs.records = records
		await ctx.render('profile', ctx.hbs)
	} catch(err) {
		console.log(err)
		ctx.hbs.error = err.message
		await ctx.render('error', ctx.hbs)
	}
}
/**
 * Updates the logged in user's profile upon POST request using helper functions defined in the profile module
 * @param {Object} ctx - JSON object containing the request and associated headers
 * @return {Object} Returns a redirect object notifying the user that the profile has been updated
 */
async function updateProfile(ctx) {
	const profile = await new Profile(dbName)
	try {
		console.log(ctx.request.body)
		ctx.request.body.account = ctx.session.userid
		await profile.update(ctx.request.body, ctx.session.userid)
		return ctx.redirect('/profile?msg=Profile updated')
	} catch(err) {
		console.log(err)
		await ctx.render('error', ctx.hbs)
	} finally {
		profile.close()
	}
}
/* Export the router (which includes the associated methods) for use in routes.js */
export default router
