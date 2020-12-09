
import test from 'ava'
import Accounts from '../modules/accounts.js' // Since profile functionality is integrated with accounts, import it

test('GETBYID : retrieve profile information from a newly created account', async test => {
	test.plan(1)
	const profile = await new Accounts()
	try {
		await profile.register('doej', 'password', 'doej@gmail.com') // First register a new account
		const profileData = await profile.getById(1) // Since we know the first auto-increment ID is 1, check for this
		test.is(profileData.length, 1, 'Profile could not be fetched') // We expect one record so length should be 1
	} catch(err) {
		test.fail(`Error occurred during testing ${err}`)
	} finally {
		profile.close()
	}
})

test('GETBYID : retrieve profile information from a non existent account', async test => {
	test.plan(1)
	const id = 5
	const profile = await new Accounts()
	try {
		await profile.getById(id)
		test.fail('Error not raised')
	} catch(err) {
		test.is(err.message, `No record found for id "${id}"`, 'Incorrect error message')
	} finally {
		profile.close()
	}
})

test('UPDATE : update values on existing account', async test => {
	test.plan(1)
	const profile = await new Accounts()
	const id = 1
	const updatedData = {
		  firstName: 'John',
		  lastName: 'Smith',
		  company: 'Coventry University',
		  addressLine1: 'Gulson Rd',
		  addressLine2: 'test',
		  city: 'Coventry',
		  postcode: 'CV1 2JH'
	}
	try {
		await profile.register('doej', 'password', 'doej@gmail.com')
		const profileUpdateStatus = await profile.update(updatedData, id)
		test.is(profileUpdateStatus, true, 'Profile unable to be updated')
	} catch(err) {
		test.fail(`Error occurred during testing ${err}`)
	} finally {
		profile.close()
	}
})

test('UPDATE : error updating with incorrect data', async test => {
	test.plan(1)
	const profile = await new Accounts()
	const id = 1
	const updatedData = 'daniel, jones, coventry university, gulson rd'
	try {
		await profile.register('doej', 'password', 'doej@gmail.com')
		await profile.update(updatedData, id)
		test.fail('Error not raised')
	} catch(err) {
		test.is(err.message, 'Invalid data sent, must be valid JSON', 'Incorrect error message')
	} finally {
		profile.close()
	}
})

test('UPDATE : error updating with null data', async test => {
	test.plan(1)
	const profile = await new Accounts()
	const id = 1
	const updatedData = null
	try {
		await profile.register('doej', 'password', 'doej@gmail.com')
		await profile.update(updatedData, id)
		test.fail('Error not raised')
	} catch(err) {
		test.is(err.message, 'Invalid data sent, must be valid JSON', 'Incorrect error message')
	} finally {
		profile.close()
	}
})
