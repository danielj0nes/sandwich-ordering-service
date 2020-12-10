# Sandwich Ordering Service - Daniel Jones - 7929997

## Testing
The following accounts in conjunction with the password `p455w0rd` allow the system to be tested.
1. `customer1`
2. `customer2`
3. `customer3`
4. `owner`

---

## Completed

* Stage 1 part 1 - Customers can login and set up a profile
* Stage 1 part 2 - Customers can add items to their order and checkout
* Stage 1 part 3 - The owner can see a list of items past 11AM grouped by postcode for each customer

## To do

## Stage 2

This builds on the work you have already completed and adds additional functionality.

1. When the `owner` sees the daily orders they can see an overall pick list for each product showing how many are needed to complete the daily order.
2. When the `customer` places their order they receive an email confirmation that includes:
    1. A list of the items ordered including individual item prices.
    2. A total price.
    3. The 10 character order number.
    4. A QR Code of this 10 character order number.
3. The `owner` sees the list of deliveries and next to each delivery there is:
    1. The 10 character order number.
    2. A button labelled **Delivered** which is clicked to flag that the items were delivered to the customer.
    3. A button to go to a screen that displays the order details including the QR code representing the 10 character order number.
