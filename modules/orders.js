/**
 * The purpose of this file is to handle all CRUD operations on the database associated with orders
 * @module modules/orders
 * @author Daniel Jones
 */

import sqlite from 'sqlite-async'
import mime from 'mime-types'
import fs from 'fs-extra'

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
	 * @returns {Array} returns an array containing all of the menu items in the database
	 */
	async add(data) {
		const orderItems = JSON.stringify(data.orderContents)
		try {
			const sql = `INSERT INTO orders(items, userid, price)\
						VALUES('${orderItems}', ${data.userid}, ${data.total})`
			await this.db.run(sql)
			return true
		} catch(err) {
			console.log(err)
			throw err
		}
	}
	async getById(userid) {
		const sql = `SELECT * FROM orders WHERE userid = ${userid} and completed = 0`
		const order = await this.db.all(sql)
		return order
	}
	async getByCategory(category) {
		const sql = `SELECT * FROM menu WHERE category = "${category}"`
		const items = await this.db.all(sql)
		return items
	}
	async close() {
		await this.db.close()
	}
}

export default Order
