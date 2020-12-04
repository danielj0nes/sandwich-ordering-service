/**
 * The purpose of this file is to handle all CRUD operations on the database associated with user profiles
 * @module modules/profile
 * @author Daniel Jones
 */

import sqlite from 'sqlite-async'

/**
 *
 * ES6 module that manages the user profile, tied to the users table in the Sandwich Ordering Service system
 */
class Profile {
	/**
   * Create a profile object
   * @param {String} [dbName=":memory:"] - The name of the database file to use.
   */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			const sql = 'CREATE TABLE IF NOT EXISTS users(\
						id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT,\
						pass TEXT, email TEXT, firstName TEXT, lastName TEXT,\
						company TEXT, addressLine1 TEXT, addressLine2 TEXT,\
						city TEXT, postcode TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * Returns the relevant data from the users table queried by the user id
	 * @params {Number} - the id of a user
	 * @returns {Boolean} - returns an array containing all of the user details for
	 */
	async all(userid) {
		const sql = `SELECT * FROM users WHERE id = ${userid};`
		const profile = await this.db.all(sql)
		return profile
	}
	/**
	 * Update profile related user data by the id of the user
	 * @params {Object} - json object (request body)
	 * @params {Number} - the id of a user
	 * @returns {Boolean} - returns true upon success
	 */
	async update(data, userid) {
		try {
			const sql = `UPDATE users SET firstName = "${data.firstName}",\
						lastName = "${data.lastName}", company = "${data.company}",\
						addressLine1 = "${data.addressLine1}", addressLine2 = "${data.addressLine2}",\
						city = "${data.city}", postcode = "${data.postcode}" WHERE id = ${userid};`
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

export default Profile
