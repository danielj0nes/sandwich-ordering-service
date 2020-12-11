/**
 * The purpose of this file is to handle all CRUD operations on the database associated with orders
 * @module modules/orders
 * @author Daniel Jones
 */

import sqlite from 'sqlite-async'
import QRCode from 'qrcode'
import fs from 'fs' // To read email credentials from emailconfig
import nodemailer from 'nodemailer'

const emailCredentials = fs.readFileSync('emailconfig.txt', 'utf8').toString().split('\n')
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
			let sql = 'CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT, userid INTEGER NOT NULL,\
					  items TEXT NOT NULL, price INTEGER NOT NULL, status TEXT NOT NULL DEFAULT "In progress",\
					  orderNumber TEXT, itemNames TEXT, itemPrices TEXT, qrcode TEXT,\
					  FOREIGN KEY (userid) REFERENCES users(id));'
			await this.db.run(sql)
			sql = 'CREATE TABLE IF NOT EXISTS checkout(id INTEGER PRIMARY KEY AUTOINCREMENT,\
				  userid INTEGER NOT NULL, items TEXT NOT NULL, price INTEGER NOT NULL, itemNames TEXT,\
				  itemPrices TEXT, FOREIGN KEY (userid) REFERENCES users(id));'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * Process data and then add a new checkout record into the database
	 * @param {Object} data - JSON object containing the request headers and values
	 * @return {Boolean} returns true upon success and false upon failure
	 */
	async addToCheckout(data) {
		if (data.total === 0) return false // If no items added don't add to database
		else {
			const checkoutItems = JSON.stringify(data.orderContents)
			/* Create empty variables to append string content of JSON for additional fields */
			let itemNames = ''
			let itemPrices = ''
			for (const item of JSON.parse(checkoutItems)) {
				itemNames += `${item.name}, `
				itemPrices += `£${item.price} ${item.name}, `
			}
			itemNames = itemNames.slice(0, sliceLength)
			itemPrices = itemPrices.slice(0, sliceLength)
			const sql = `INSERT INTO checkout(items, userid, price, itemNames, itemPrices)
					   VALUES('${checkoutItems}', ${data.userid}, ${data.total}, '${itemNames}', '${itemPrices}');`
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
		const sql = `SELECT * FROM checkout WHERE userid = ${userid};`
		const userCheckout = await this.db.all(sql)
		if (userCheckout.length === 0) {
			return false
		} else {
			return userCheckout
		}
	}
	/**
	 * Processes a checked out order marking it as ready for the owner to work on
	 * Runs the updateLast helper function to create and add in the 10-digit order number
	 * @param {Object} data - JSON object containing the request headers and values
	 * @return {Object} orderInfo -  on successful processing of order, return JSON object
	 * @return {Boolean} return true if data but unable to update order, false on removal flag of data status
	 */
	async processOrder(data) {
		if (data.status) {
			let sql = `SELECT * FROM checkout WHERE ID = ${data.id}`
			const userOrder = await this.db.all(sql)
			sql = `INSERT INTO orders (userid, items, price, itemNames, itemPrices) VALUES
				  (${userOrder[0].userid}, '${userOrder[0].items}',
				  ${userOrder[0].price}, '${userOrder[0].itemNames}', '${userOrder[0].itemPrices}');`
			await this.db.run(sql)
			const orderInfo = await this.updateLast()
			await this.db.run(`DELETE FROM checkout WHERE ID = ${data.id};`)
			if (orderInfo) return orderInfo
			else return true
		} else {
			const sql = `DELETE FROM checkout WHERE ID = ${data.id};`
			await this.db.run(sql)
			return false
		}
	}
	/**
	 * Helper function used in conjunction with the 'processOrder' function
	 * Updates the last inserted record with additional data
	 * This includes: the orderNumber and itemNames
	 */
	async updateLast() {
		let sql = 'SELECT * FROM orders WHERE id = (SELECT MAX(id) FROM orders);'
		const userOrder = await this.db.all(sql) // Get the newly inserted record
		const orderNumber = userOrder[0].id.toString().padStart(orderNumberLength, '0')
		const qrcode = await this.generateQRCode(orderNumber)
		sql = `UPDATE orders SET orderNumber = "${orderNumber}",
			   qrcode = "${qrcode}" WHERE id = ${userOrder[0].id};`
		await this.db.run(sql)
		try {
			return await this.getByOrderId(userOrder[0].id)
		} catch (err) {
			console.log(`Error caught, likely no user table created / in memory - ${err}`)
		}
	}
	/**
	 * Helper function used in conjunction with the 'processOrder' function
	 * Updates the last inserted record with additional data
	 * This includes: the orderNumber and itemNames
	 */
	async updateStatus(data) {
		if (typeof data !== 'object' || data === null) throw new Error('Invalid data sent, must be valid JSON')
		const sql = `UPDATE orders SET status = "${data.status}" WHERE id = ${data.id};`
		await this.db.run(sql)
		return true
	}
	/**
	 * Returns all orders by a given userid
	 * @param {Integer} userid - The ID of a user
	 * @return {Boolean} Returns false if there are no existing orders found
	 * @return {Object} userCheckout - Otherwise returns the records retrieved from the database in JSON format
	 */
	async getById(userid) {
		const sql = `SELECT * FROM orders WHERE userid = ${userid};`
		const userOrder = await this.db.all(sql)
		if (userOrder.length === 0) return false
		else return userOrder
	}
	/**
	 * Returns an order by it's orderid
	 * @param {Integer} orderid - The order id
	 * @return {Boolean} Returns false if there are no existing orders found
	 * @return {Object} userCheckout - Otherwise returns the records retrieved from the database in JSON format
	 */
	async getByOrderId(orderid) {
		try {
			const sql = `SELECT orders.id as orderid, * FROM ORDERS 
						 INNER JOIN users on users.id = orders.userid WHERE orderid = ${orderid};`
			return await this.db.all(sql)
		} catch(err) {
			return false
		}
	}
	/**
	 * Returns all orders and information associated with the user that placed the order by status
	 * Orders the records by postcode to achieve the stage1-part3 functionality
	 * @param {String} status - The status text, i.e 'In progress' or 'Delivered'
	 * @param {String} [orderby = 'postcode'] - Optionally order the records, default argument is postcode
	 * @return {Object} allOrders - Return all records retrieved from the orders table in JSON format
	 */
	async getAll(status, orderby = 'postcode') {
		const sql = `SELECT orders.id as orderid, * FROM orders\
					INNER JOIN users ON users.id = orders.userid WHERE status = "${status}" ORDER BY "${orderby}";`
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
		const sql = 'SELECT * FROM orders WHERE status = "In progress";'
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
	/**
	 * Helper function used in conjunction with the updateLast function
	 * Generates a QR code based on the orderNumber and saves it locally to orders/qrcodes
	 * @param {String} orderNumber - the 10 digit order number string
	 * @return {String} The string file name of the QR Code
	 */
	async generateQRCode(orderNumber) {
		const path = `public/qrcodes/${orderNumber}.png`
		QRCode.toFile(path, orderNumber, async(err) => {
			if (err) throw err
		})
		return `${orderNumber}.png`
	}
	/**
	 * Stage 2 part 2 functionality
	 * Given data as provided by processOrder, sends an email containing:
	 * Order number, items, prices, total price, QR code of order number
	 * @param {Object} content - JSON object containing headers and data pertaining to the order and user
	 */
	async emailUser(data) {
		const subject = `ORDER CONFIRMED - ORDER NO. ${data.orderNumber}`
		const body = `Order number: ${data.orderNumber}\nItems: ${data.itemPrices}\nTotal: £${data.price}\n`
		const mailOptions = {
			from: emailCredentials[0], to: data.email, subject: subject, text: body,
			attachments: [{filename: `order_${data.orderNumber}.png`, path: `public/qrcodes/${data.qrcode}`}]
		}
		const mailer = nodemailer.createTransport({
			service: 'gmail', auth: { user: emailCredentials[0], pass: emailCredentials[1] }})
		mailer.sendMail(mailOptions, async(err, emaildata) => {
			if (err) console.log(err)
			else console.log(`Email sent to ${data.email} response: ${emaildata.response}`)
		})
	}
	async close() {
		await this.db.close()
	}
}
/* Export the Order object (which includes the associated methods) */
export default Order
