/**
 * The purpose of this file is to handle all CRUD operations on the database associated with orders
 * @module modules/orders
 * @author Daniel Jones
 */

import sqlite from 'sqlite-async'

const orderNumberLength = 10
const sliceLength = -2

/**
 *
 * ES6 module that manages orders in the Sandwich Ordering Service system.
 */
class Order {
	/**
   * Create an order object
   * @param {String} [dbName=":memory:"] - The name of the database file to use.
   */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			const sql = 'CREATE TABLE IF NOT EXISTS orders(\
						id INTEGER PRIMARY KEY AUTOINCREMENT,\
						userid INTEGER NOT NULL,\
						items TEXT NOT NULL,\
						price INTEGER NOT NULL,\
						completed INTEGER NOT NULL DEFAULT 0,\
						FOREIGN KEY (userid) REFERENCES users(id)\
						);'

			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * Retrieves all the items from the menu
	 * @returns {Boolean} returns true upon success and false upon failure
	 */
	async add(data) {
		const orderItems = JSON.stringify(data.orderContents)
		if (data.total === 0) {
			return false // If not items added don't add to database
		} else {
			try {
				const sql = `INSERT INTO orders(items, userid, price)
						   VALUES('${orderItems}', ${data.userid}, ${data.total});`
				await this.db.run(sql)
				this.updateLast()
				return true
			} catch(err) {
				console.log(err)
				throw err
			}
		}
	}
	async updateLast() {
		let sql = 'SELECT * FROM orders where id = (SELECT MAX(id) FROM orders);'
		const userOrder = await this.db.all(sql) // Get the newly inserted record
		const orderNumber = userOrder[0].id.toString().padStart(orderNumberLength, '0')
		let itemNames = ''
		for (const item of JSON.parse(userOrder[0].items)) {
			itemNames += `${item.name}, `
		}
		itemNames = itemNames.slice(0, sliceLength)
		sql = `UPDATE orders SET orderNumber = "${orderNumber}",
			  itemNames = "${itemNames}" WHERE id = ${userOrder[0].id}`
		await this.db.run(sql)
	}
	async getById(userid) {
		const sql = `SELECT * FROM orders WHERE userid = ${userid} and completed = 0;`
		const userOrder = await this.db.all(sql)
		if (userOrder.length === 0) {
			return false
		} else {
			return userOrder
		}
	}
	async close() {
		await this.db.close()
	}
}

export default Order
