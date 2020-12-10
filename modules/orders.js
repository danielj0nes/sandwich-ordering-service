/**
 * The purpose of this file is to handle all CRUD operations on the database associated with orders
 * @module modules/orders
 * @author Daniel Jones
 */

import sqlite from 'sqlite-async'

const orderNumberLength = 10
const sliceLength = -2

/**
 * ES6 module that manages orders in the Sandwich Ordering Service system tied to the orders table in the database.
 */
class Order {
	/**
   * Create an order object
   * @param {String} [dbName=":memory:"] - The name of the database file to use.
   */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			let sql = 'CREATE TABLE IF NOT EXISTS orders(\
					  id INTEGER PRIMARY KEY AUTOINCREMENT,\
					  userid INTEGER NOT NULL, items TEXT NOT NULL,\
					  price INTEGER NOT NULL, completed TEXT NOT NULL DEFAULT "In progress",\
					  orderNumber TEXT, itemNames TEXT,\
					  FOREIGN KEY (userid) REFERENCES users(id));'
			await this.db.run(sql)
			sql = 'CREATE TABLE IF NOT EXISTS checkout(\
				  id INTEGER PRIMARY KEY AUTOINCREMENT, userid INTEGER NOT NULL,\
				  items TEXT NOT NULL, price INTEGER NOT NULL,\
				  itemNames TEXT, FOREIGN KEY (userid) REFERENCES users(id));'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * Add a new checkout record into the database
	 * @param {Object} data - JSON object containing the request headers and values
	 * @return {Boolean} returns true upon success and false upon failure
	 */
	async addToCheckout(data) {
		if (data.total === 0) return false // If no items added don't add to database
		else {
			const checkoutItems = JSON.stringify(data.orderContents)
			let itemNames = ''
			for (const item of JSON.parse(checkoutItems)) {
				itemNames += `${item.name}, `
			}
			itemNames = itemNames.slice(0, sliceLength)
			const sql = `INSERT INTO checkout(items, userid, price, itemNames)
					   VALUES('${checkoutItems}', ${data.userid}, ${data.total}, '${itemNames}');`
			await this.db.run(sql)
			return true
		}
	}
	/**
	 * Returns a checked out order or multiple checked out orders that pertain to a user
	 * @param {Integer} userid - The ID of a user
	 * @return {Boolean} Returns false if there are no existing orders found
	 * @return {Object} Otherwise returns the records retrieved from the database in JSON format
	 */
	async getCheckout(userid) {
		const sql = `SELECT * FROM checkout WHERE userid = ${userid}`
		const userCheckout = await this.db.all(sql)
		if (userCheckout.length === 0) {
			return false
		} else {
			return userCheckout
		}
	}
	/**
	 * Processes a checked out order marking it as ready for the owner to work on
	 * Runs the updateOrder helper function to create and add in the 10-digit order number
	 * @param {Object} data - JSON object containing the request headers and values
	 * @return {Boolean} true on confirming order; false on removing
	 */
	async processOrder(data) {
		if (data.status) {
			let sql = `SELECT * FROM checkout WHERE ID = ${data.id}`
			const userOrder = await this.db.all(sql)
			sql = `INSERT INTO orders (userid, items, price, itemNames) VALUES
				  (${userOrder[0].userid}, '${userOrder[0].items}',
				  ${userOrder[0].price}, '${userOrder[0].itemNames}')`
			await this.db.run(sql)
			this.updateOrder()
			sql = `DELETE FROM checkout WHERE ID = ${data.id}`
			await this.db.run(sql)
			return true
		} else {
			const sql = `DELETE FROM checkout WHERE ID = ${data.id}`
			await this.db.run(sql)
			return false
		}
	}
	/**
	 * Helper function used in conjunction with the 'processOrder' function
	 * Updates the last inserted record with additional data
	 * This includes: the orderNumber and itemNames
	 */
	async updateOrder() {
		let sql = 'SELECT * FROM orders where id = (SELECT MAX(id) FROM orders);'
		const userOrder = await this.db.all(sql) // Get the newly inserted record
		const orderNumber = userOrder[0].id.toString().padStart(orderNumberLength, '0')
		sql = `UPDATE orders SET orderNumber = '${orderNumber}' WHERE id = ${userOrder[0].id}`
		await this.db.run(sql)
	}
	/**
	 * Returns all orders by a given userid
	 * @param {Integer} userid - The ID of a user
	 * @return {Boolean} Returns false if there are no existing orders found
	 * @return {Object} userCheckout - Otherwise returns the records retrieved from the database in JSON format
	 */
	async getById(userid) {
		const sql = `SELECT * FROM orders WHERE userid = ${userid}`
		const userOrder = await this.db.all(sql)
		if (userOrder.length === 0) return false
		else return userOrder
	}
	/**
	 * Returns all orders and information associated with the user that placed the order
	 * Orders the records by postcode to achieve the stage1-part3 functionality
	 * @return {Object} allOrders - Return all records retrieved from the orders table in JSON format
	 */
	async getAll() {
		const sql = 'SELECT orders.id as orderid, * FROM orders\
					INNER JOIN users ON users.id = orders.userid ORDER BY postcode;'
		const allOrders = await this.db.all(sql)
		if (allOrders.length === 0) return false
		else return allOrders
	}
	/**
	 * Selects all orders and iterates through them, appending item names to item list
	 * Counts each unique occurence and creates a key-value frequency object with items as keys, frequencies as values
	 * @return {Object} Return key-value object (key = item id, value = frequency)
	 */
	async getCount() {
		const items = []
		const sql = 'SELECT * FROM orders'
		const allOrders = await this.db.all(sql)
		if (allOrders.length === 0) return false
		else {
			for (const order of allOrders) {
				for (const item of JSON.parse(order.items)) {
					items.push(item.name)
				}
			}
			return items.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {})
		}
	}
	async close() {
		await this.db.close()
	}
}
/* Export the Order object (which includes the associated methods) */
export default Order
