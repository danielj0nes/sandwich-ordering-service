/**
 * The purpose of this file is to handle an assortment of CRUD operations on the database associated with the menu
 * @module modules/menu
 * @author Daniel Jones
 */

import sqlite from 'sqlite-async'
import mime from 'mime-types'
import fs from 'fs-extra'

/**
 * ES6 module that manages the menu in the Sandwich Ordering Service system tied to the menu table in the database.
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
						category TEXT NOT NULL,\
						photo TEXT\
						);'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * Retrieves all the items from the menu
	 * @return {Object} returns a JSON object containing all of the menu items and their headers from the database
	 */
	async all() {
		const sql = 'SELECT * FROM menu ORDER BY category;'
		const menu = await this.db.all(sql)
		return menu
	}
	/**
	 * Adds a new item to the menu
	 * @param {Object} - takes in the request in the form of a JSON object containing headers and values
	 * @return {Object} - returns a JSON object containing all of the menu items and their headers from the database
	 */
	async add(data) {
		console.log(data)
		let filename
		if(data.fileName) {
			filename = `${Date.now()}.${mime.extension(data.fileType)}` // Millisecond timestamp
			await fs.copy(data.filePath, `public/photos/${filename}`)
		}
		try {
			const sql = `INSERT INTO menu(itemname, price, ingredients, category, photo)\
						VALUES("${data.item}", ${data.price}, "${data.ingredients}", "${data.category}", "${filename}")`
			await this.db.run(sql)
			return true
		} catch(err) {
			console.log(err)
			throw err
		}
	}
	/**
	 * Returns a list of categories from the menu table in the databse
	 * @return {Object} - returns a JSON object containing all of the categories
	 */
	async getCategories() {
		const sql = 'SELECT DISTINCT category FROM menu'
		const categories = await this.db.all(sql)
		return categories
	}
	/**
	 * Returns a list of menu items that are linked to a given category
	 * @param {String} - the name of a menu category
	 * @return {Object} - returns a JSON object containing all of the categories
	 */
	async getByCategory(category) {
		const sql = `SELECT * FROM menu WHERE category = "${category}"`
		const items = await this.db.all(sql)
		return items
	}
	async close() {
		await this.db.close()
	}
}
/* Export the Menu object (which includes the associated methods) */
export default Menu
