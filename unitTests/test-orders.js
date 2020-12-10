
import test from 'ava'
import Order from '../modules/orders.js'

test('ADDTOCHECKOUT : do not accept checkout with total value equal to 0', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = {total: 0}
	try {
		const check = await order.addToCheckout(toAdd)
		test.is(check, false, `incorrect return value ${check}`)
	} catch(err) {
		test.fail(`Error occurred during testing ${err}`)
	} finally {
		order.close()
	}
})

test('ADDTOCHECKOUT : add object to checkout', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = {total: 16.97,
				   orderContents: [
					   { id: '1', name: 'BLT', price: 5.99 },
					   { id: '2', name: 'Tuna Mayonnaise', price: 5.99 },
					   { id: '3', name: 'Meatball Marinara', price: 4.99 }
				   ],
				   userid: 1}
	try {
		const check = await order.addToCheckout(toAdd)
		test.is(check, true, `incorrect return value ${check}`)
	} catch(err) {
		test.fail(`Error occurred during testing ${err}`)
	} finally {
		order.close()
	}
})

test('ADDTOCHECKOUT : error attempting to insert incorrect data type', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = 'test'
	try {
		await order.addToCheckout(toAdd)
		test.fail('error not raised')
	} catch(err) {
		test.is(err.message, 'Unexpected token u in JSON at position 0', 'Incorrect error message')
	} finally {
		order.close()
	}
})

test('GETCHECKOUT : add and fetch item from checkout; check item name property', async test => {
	test.plan(1)
	const order = await new Order()
	const expectedResult = 'Bacon Sandwich, Bacon Sandwich, Bacon Sandwich'
	const toAdd = {total: 15,
				   orderContents: [
					   { id: '1', name: 'Bacon Sandwich', price: 5 },
					   { id: '1', name: 'Bacon Sandwich', price: 5 },
					   { id: '1', name: 'Bacon Sandwich', price: 5 }
				   ],
				   userid: 1}
	try {
		await order.addToCheckout(toAdd)
		const userCheckout = await order.getCheckout(1)
		test.is(userCheckout[0].itemNames, expectedResult, 'Incorrect item names returned')
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		order.close()
	}
})

test('GETCHECKOUT : attempt to fetch empty checkout', async test => {
	test.plan(1)
	const order = await new Order()
	try {
		const userCheckout = await order.getCheckout(1)
		test.is(userCheckout, false, `Expected return type false, got ${typeof userCheckout}`)
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		order.close()
	}
})

test('GETCHECKOUT : attempt to fetch multiple checkouts from a user', async test => {
	test.plan(1)
	const order = await new Order()
	const order1 = {total: 20,
				   orderContents: [
					   { id: '1', name: 'Bacon Sandwich', price: 5 },
					   { id: '2', name: 'BLT', price: 5 },
					   { id: '1', name: 'Bacon Sandwich', price: 5 },
					   { id: '3', name: 'Tuna Mayonnaise', price: 5 }
				   ],
				   userid: 1}
	const order2 = {total: 2,
				   orderContents: [
					   { id: '5', name: 'Coke', price: 1 },
					   { id: '6', name: 'Salt and Vinegar Crisps', price: 1 },
				   ],
				   userid: 1}
	try {
		await order.addToCheckout(order1)
		await order.addToCheckout(order2)
		const userCheckout = await order.getCheckout(1)
		test.is(userCheckout.length, 2, `Expected length of 2, got ${userCheckout.length}`)
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		order.close()
	}
})

test('PROCESSORDER : attempt to process a checked out order', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = {total: 20,
				   orderContents: [
					   { id: '1', name: 'Bacon Sandwich', price: 5 },
					   { id: '2', name: 'BLT', price: 5 },
					   { id: '1', name: 'Bacon Sandwich', price: 5 },
					   { id: '3', name: 'Tuna Mayonnaise', price: 5 }
				   ],
				   itemNames: 'Bacon Sandwich, BLT, Bacon Sandwich, Tuna Mayonnaise',
				   userid: 1}
	try {
		await order.addToCheckout(toAdd)
		const result = await order.processOrder({id: 1, status: true})
		test.is(result, true, `Expected return type true, got ${typeof result}`)
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		order.close()
	}
})

test('PROCESSORDER : attempt to delete a checked out order', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = {total: 20,
				   orderContents: [
					   { id: '1', name: 'Bacon Sandwich', price: 5 },
					   { id: '2', name: 'BLT', price: 5 },
					   { id: '1', name: 'Bacon Sandwich', price: 5 },
					   { id: '3', name: 'Tuna Mayonnaise', price: 5 }
				   ],
				   itemNames: 'Bacon Sandwich, BLT, Bacon Sandwich, Tuna Mayonnaise',
				   userid: 1}
	try {
		await order.addToCheckout(toAdd)
		const result = await order.processOrder({id: 1, status: false})
		test.is(result, false, `Expected return type false, got ${typeof result}`)
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		order.close()
	}
})

test('PROCESSORDER : error attempting to process invalid order', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = {bad: 'data'}
	try {
		await order.processOrder(toAdd)
		test.fail('Error not raised')
	} catch(err) {
		test.is(err.message, 'SQLITE_ERROR: no such column: undefined', 'Incorrect error message')
	} finally {
		order.close()
	}
})

/* Since processOrder calls the helper updateOrder function, we test it's functionality through this */
test('UPDATEORDER : check order number created correctly', async test => {
	test.plan(1)
	const order = await new Order()
	const expectedNumber = '0000000001'
	const toAdd = {total: 21,
				   orderContents: [
					   { id: '1', name: 'Crab Sandwich', price: 7 },
					   { id: '2', name: 'Falaffel Wrap', price: 7 },
					   { id: '1', name: 'Crab Sandwich', price: 7 },
				   ],
				   userid: 1}
	try {
		await order.addToCheckout(toAdd)
		await order.processOrder({id: 1, status: true})
		const result = await order.getById(1)
		test.is(result[0].orderNumber, expectedNumber, `Expected ${expectedNumber}, got ${result.orderNumber}`)
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		order.close()
	}
})

test('GETBYID : return false when attempting to retrieve invalid / non existing order', async test => {
	test.plan(1)
	const order = await new Order()
	try {
		const result = await order.getById(1)
		test.is(result, false, `Expected false, got ${typeof result}`)
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		order.close()
	}
})

test('GETBYID : error when querying bad type', async test => {
	test.plan(1)
	const order = await new Order()
	try {
		await order.getById('badtype')
		test.fail('Error not raised')
	} catch(err) {
		test.is(err.code, 'SQLITE_ERROR', 'Incorrect error code')
	} finally {
		order.close()
	}
})
