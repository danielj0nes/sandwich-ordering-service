
//import test from 'ava'
import Profile from '../modules/profile.js'


test('GETBYID : RETRIEVE PROFILE INFORMATION OF NEWLY CREATED ACCOUNT', async test => {
	test.plan(1)
	const profile = await new Profile()
	try {
		const profileData = await profile.getById(1) // Since we're running in-memory, we know that the account will have an ID of 1 (due to auto-increment)
		console.log(profileData)
		
		test.is(profileData, 1, 'unable to log in') // Check for return type of 1 because of autoincrementing userid
	} catch(err) {
		test.fail(`Error occurred during testing ${err}`)
	} finally {
		account.close()
		profile.close()
	}
})


const account = await new Accounts() // Utilise the accounts module to create a new account
const profile = await new Profile()
try {
	await account.register('doej', 'password', 'doej@gmail.com')
	const login = await account.login('doej', 'password')
	console.log(login)
	const profileData = await profile.getById(login) // Since we're running in-memory, we know that the account will have an ID of 1 (due to auto-increment)
	console.log(profileData)
} catch(err) {
	console.log(err)
}
 finally {
	 account.close()
	 profile.close()
}
		