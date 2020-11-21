
/** @module profile */

import sqlite from 'sqlite-async'

/**
 *
 * ES6 module that manages the profile of a user in the Sandwich Ordering Service system.
 */
class Profile {
	/**
   * Create a profile object
   * @param {String} [dbName=":memory:"] - The name of the database file to use.
   */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			const sql = 'CREATE TABLE IF NOT EXISTS users\
				(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, pass TEXT, email TEXT,\
				firstName TEXT, lastName TEXT, company TEXT, addressLine1 TEXT,\
				addressLine2 TEXT, city TEXT, postcode TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * Retrieves all information about the user based on their userid
	 * @param {number} - The id number of the currently logged-in user
	 * @returns {Array} returns an array containing all of the information regarding the logged-in user
	 */
	async all(userid) {
		const sql = `SELECT * FROM users WHERE id="${userid}";`
		const userinfo = await this.db.all(sql)
		return userinfo
	}
	/**
	 * Adds new information provided by the user into the users table
	 * @param {data}
	 * @returns {boolean} returns true upon success otherwise throw error
	 */
	async add(data, userid) {
		console.log(data)
		console.log(typeof data)
		try {
			const sql = `UPDATE users SET firstName = "${data.firstName}", lastName = "${data.lastName}",\
						company = "${data.company}", addressLine1 = "${data.addressLine1}",\
						addressLine2 = "${data.addressLine2}", city = "${data.city}",\
						postcode = "${data.postcode}" WHERE id = ${userid}`
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
