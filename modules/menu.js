
/** @module menu */

import sqlite from 'sqlite-async'
import mime from 'mime-types'
import fs from 'fs-extra'

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
						ingredients TEXT,\
						photo TEXT\
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
	async add(data) {
		console.log(data)
		let filename
		if(data.fileName) {
			filename = `${Date.now()}.${mime.extension(data.fileType)}` // Millisecond timestamp
			await fs.copy(data.filePath, `public/photos/${filename}`)
		}
		try {
			const sql = `INSERT INTO menu(itemname, price, ingredients, photo)\
						VALUES("${data.item}", ${data.price}, "${data.ingredients}", "${filename}")`
			await this.db.run(sql)
			return true
		} catch(err) {
			console.log(err)
			throw err
		}
	}
	async close() {
		await this.db.close()
	}
}

export default Menu
