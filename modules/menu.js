
/** @module menu */

import sqlite from 'sqlite-async'


/**
 * 
 * ES6 module that manages the menu in the Sandwich Ordering Service system.
 */
class Menu {
	/**
   * Create a menu object
   * @param {String} [dbName=":memory:"] - The name of the database file to use.
   */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			const sql = 'CREATE TABLE IF NOT EXISTS menu(\
				id INTEGER PRIMARY KEY AUTOINCREMENT,\
				itemname TEXT NOT NULL,\
				price INTEGER NOT NULL,\
				ingredients TEXT\
			);'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * Retrieves all the items from the menu
	 * @returns {Array} returns an array containing all of the menu items in the database
	 */
	async all() {
		const sql = 'SELECT * FROM menu;'
		const menu = await this.db.all(sql)
		return menu
	}
}

export default Menu
