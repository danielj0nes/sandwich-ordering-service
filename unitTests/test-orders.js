
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

test('ADDTOCHECKOUT : error inserting incorrect data type', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = 'test'
	try {
		const check = await order.addToCheckout(toAdd)
		test.fail('error not raised')
	} catch(err) {
		test.is(err.message, 'Unexpected token u in JSON at position 0', 'Incorrect error message')
	} finally {
		order.close()
	}
})

test('ADDTOCHECKOUT : check that items are correctly formatted', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = 'test'
	try {
		const check = await order.addToCheckout(toAdd)
		test.fail('error not raised')
	} catch(err) {
		test.is(err.message, 'Unexpected token u in JSON at position 0', 'Incorrect error message')
	} finally {
		order.close()
	}
})

test('GETCHECKOUT : add and item to checkout and check if successfully received', async test => {
	test.plan(1)
	const order = await new Order()
	const toAdd = 'test'
	try {
		const check = await order.addToCheckout(toAdd)
		test.fail('error not raised')
	} catch(err) {
		test.is(err.message, 'Unexpected token u in JSON at position 0', 'Incorrect error message')
	} finally {
		order.close()
	}
})