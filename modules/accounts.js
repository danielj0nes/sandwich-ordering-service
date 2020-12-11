/**
 * This file handles the logging in and registering functionality
 * It also handles CRUD operations regarding the user profile, such as returning additional user info
 * @module modules/accounts
 * @author Mark Tyers + Daniel Jones
 */

import bcrypt from 'bcrypt-promise'
import sqlite from 'sqlite-async'
/**
 * @const {integer} - The amount of salt rounds that are applied to hashed user password
 */
const saltRounds = 10

/**
 * Accounts
 * ES6 module that handles registering accounts and logging in
 * The module also handles an assortment of CRUD operations associated with the users table
 */
class Accounts {
	/**
   * Create an account object
   * @param {String} [dbName=":memory:"] - The name of the database file to use.
   */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
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
	 * registers a new user
	 * @param {String} user the chosen username
	 * @param {String} pass the chosen password
	 * @param {String} email the chosen email
	 * @returns {Boolean} returns true if the new user has been added
	 */
	async register(user, pass, email) {
		Array.from(arguments).forEach( val => {
			if(val.length === 0) throw new Error('missing field')
		})
		let sql = `SELECT COUNT(id) as records FROM users WHERE user="${user}";`
		const data = await this.db.get(sql)
		if(data.records !== 0) throw new Error(`username "${user}" already in use`)
		sql = `SELECT COUNT(id) as records FROM users WHERE email="${email}";`
		const emails = await this.db.get(sql)
		if(emails.records !== 0) throw new Error(`email address "${email}" is already in use`)
		pass = await bcrypt.hash(pass, saltRounds)
		sql = `INSERT INTO users(user, pass, email) VALUES("${user}", "${pass}", "${email}")`
		await this.db.run(sql)
		return true
	}
	/**
	 * checks to see if a set of login credentials are valid
	 * @param {String} username the username to check
	 * @param {String} password the password to check
	 * @returns {Boolean} returns true if credentials are valid
	 */
	async login(username, password) {
		let sql = `SELECT count(id) AS count FROM users WHERE user="${username}";`
		const records = await this.db.get(sql)
		if(!records.count) throw new Error(`username "${username}" not found`)
		sql = `SELECT id, pass FROM users WHERE user = "${username}";`
		const record = await this.db.get(sql)
		const valid = await bcrypt.compare(password, record.pass)
		if(valid === false) throw new Error(`invalid password for account "${username}"`)
		return record.id
	}
	/**
	 * Returns the relevant data from the users table queried by the user id
	 * @params {Integer} userid - the id of a user
	 * @returns {Object} returns a JSON object containing the headers and values pertaining to the given user ID
	 */
	async getById(userid) {
		const sql = `SELECT * FROM users WHERE id = ${userid};`
		const profile = await this.db.all(sql)
		if (profile.length === 0) throw new Error(`No record found for id "${userid}"`)
		else return profile
	}
	/**
	 * Update profile related user data by the id of the user
	 * @params {Object} data - json object (request body)
	 * @params {Integer} userid - the id of a user
	 * @returns {Boolean} returns true upon success
	 */
	async update(data, userid) {
		if (typeof data !== 'object' || data === null) throw new Error('Invalid data sent, must be valid JSON')
		const sql = `UPDATE users SET firstName = "${data.firstName}",
					lastName = "${data.lastName}", email = "${data.email}", company = "${data.company}",
					addressLine1 = "${data.addressLine1}", addressLine2 = "${data.addressLine2}",
					city = "${data.city}", postcode = "${data.postcode}" WHERE id = ${userid};`
		await this.db.run(sql)
		return true
	}
	async close() {
		await this.db.close()
	}
}

export default Accounts
