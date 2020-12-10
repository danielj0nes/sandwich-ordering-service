
import test from 'ava'
import Menu from '../modules/menu.js'

test('ADD : insert new item into the menu', async test => {
	test.plan(1)
	const menu = await new Menu()
	/* Create a valid item and attempt to add it to the menu */
	const newItem = {item: 'Chicken Sandwich', price: 2.99, ingredients:
					 'Chicken, Bread, Mayonnaise', category: 'Sandwich'}
	try {
		const result = await menu.add(newItem)
		test.is(result, true, 'failed to add new menu item')
	} catch(err) {
		test.fail(`Error occurred during testing ${err}`)
	} finally {
		menu.close()
	}
})

test('ADD : error inserting incorrect data type', async test => {
	test.plan(1)
	const menu = await new Menu()
	/* Data needs to follow a valid JSON schema */
	const newItem = 'chicken sandwich'
	try {
		await menu.add(newItem)
		test.fail('error not raised')
	} catch(err) {
		test.is(err.message, 'SQLITE_ERROR: no such column: undefined', 'Incorrect error message')
	} finally {
		menu.close()
	}
})

test('ADD : error inserting incorrect data format', async test => {
	test.plan(1)
	const menu = await new Menu()
	/* Create data with incorrect categories and attempt to add */
	const newItem = {item: 'chicken sandwich', cost: '2.99', category: 'Sarnie'}
	try {
		await menu.add(newItem)
		test.fail('error not raised')
	} catch(err) {
		test.is(err.message, 'SQLITE_ERROR: no such column: undefined', 'Incorrect error message')
	} finally {
		menu.close()
	}
})

test('ADD : error inserting null data', async test => {
	test.plan(1)
	const menu = await new Menu()
	const newItem = {cost: '2.99', category: 'Sarnie'}
	try {
		await menu.add(newItem)
		test.fail('error not raised')
	} catch(err) {
		test.is(err.message, 'SQLITE_ERROR: no such column: undefined', 'Incorrect error message')
	} finally {
		menu.close()
	}
})

test('GETCATEGORIES : retrieve expected categories', async test => {
	test.plan(3)
	const menu = await new Menu()
	try {
		/* First create and add some data */
		const sandwichCategory = {item: 'Chicken sandwich', price: 2.99, category: 'Sandwich'}
		const snackCategory = {item: 'Smoky Bacon Crisps', price: 0.99, category: 'Snack'}
		const drinkCategory = {item: 'Water', price: 1, category: 'Drink'}
		await menu.add(sandwichCategory)
		await menu.add(snackCategory)
		await menu.add(drinkCategory)
		const result = await menu.getCategories() // Fetch the categories
		test.is(result[0].category, 'Sandwich', `Failed to retrieve category ${result[0].category}`)
		test.is(result[1].category, 'Snack', `Failed to retrieve category ${result[1].category}`)
		test.is(result[2].category, 'Drink', `Failed to retrieve category ${result[2].category}`)
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		menu.close()
	}
})

test('GETCATEGORIES : retrieve no categories', async test => {
	test.plan(1)
	const menu = await new Menu()
	try {
		const result = await menu.getCategories()
		test.is(result.length, 0, 'Category retrieved')
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		menu.close()
	}
})

test('GETBYCATEGORY : retrieve expected items from category', async test => {
	test.plan(3)
	const menu = await new Menu()
	const testSandwich1 = {item: 'BLT', price: 3.99, category: 'Sandwich'}
	const testSandwich2 = {item: 'Tuna Mayonnaise', price: 3.49, category: 'Sandwich'}
	const testSnack = {item: 'Salt and Vinegar Crisps', price: 1, category: 'Snack'}
	const testDrink = {item: 'Cola', price: 0.89, category: 'Drink'}
	try {
		await menu.add(testSandwich1)
		await menu.add(testSandwich2)
		await menu.add(testSnack)
		await menu.add(testDrink)
		const sandwichResult = await menu.getByCategory('Sandwich')
		const snackResult = await menu.getByCategory('Snack')
		const drinkResult = await menu.getByCategory('Drink')
		test.is(sandwichResult.length, 2, 'Incorrect amount of items returned')
		test.is(snackResult.length, 1, 'Incorrect amount of items returned')
		test.is(drinkResult.length, 1, 'Incorrect amount of items returned')
	} catch(err) {
		test.fail(`Error occured during testing ${err}`)
	} finally {
		menu.close()
	}
})

test('GETBYCATEGORY : error fetching invalid category', async test => {
	test.plan(1)
	const menu = await new Menu()
	const testSandwich = {item: 'Bacon Sandwich', price: 1.99, category: 'Sandwich'}
	const invalidCategory = 'Not a category'
	try {
		await menu.add(testSandwich)
		await menu.getByCategory(invalidCategory)
		test.fail('No error raised')
	} catch(err) {
		test.is(err.message, `No result returned for category "${invalidCategory}"`, 'Incorrect error message')
	} finally {
		menu.close()
	}
})
