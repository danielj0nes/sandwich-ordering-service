
/** @module Contacts */

import sqlite from 'sqlite-async'


/**
 * Contacts
 * ES6 module that manages the contacts in the Sandwich Ordering Service system.
 */
class Contacts {
	/**
   * Create a Contact object
   * @param {String} [dbName=":memory:"] - The name of the database file to use.
   */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			const sql = 'CREATE TABLE IF NOT EXISTS contacts(\
				id INTEGER PRIMARY KEY AUTOINCREMENT,\
				userid INTEGER,\
				firstname TEXT NOT NULL,\
				lastname TEXT NOT NULL,\
				company TEXT, url TEXT,\
				lastcontact INTEGER,\
				FOREIGN KEY(userid) REFERENCES users(id)\
			);'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * Retrieves all the contacts in the system
	 * @returns {Array} returns an array containing all of the contacts in the database
	 */
	async all() {
		const sql = 'SELECT users.user, contacts.* FROM contacts, users\
									WHERE contacts.userid = users.id;'
		const contacts = await this.db.all(sql)
		for(const index in contacts) {
			const dateTime = new Date(contacts[index].lastcontact)
			const date = `${dateTime.getDate()}/${dateTime.getMonth()+1}/${dateTime.getFullYear()}`
			contacts[index].lastcontact = date
		}
		return contacts
	}
}

export default Contacts
