

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const stripe = require('stripe')("STRIPE_KEY");
const cors = require('cors')({
	origin: true,
});

admin.initializeApp(functions.config().firebase);


// Checks to see if a customer for the e-mail exists
// Example: getCustomer.post().form({email: "darran7777777@gmail.com"})
exports.getCustomer = functions.https.onRequest((req, res) => {

	return cors(req, res, () => {

		stripe.customers.list({
				email: req.body.email
			},
			function (err: any, customer: any) {
				if (customer) {
					res.status(200).send(customer);
				} else {
					console.log(err);
					reportError(err);
				}
			}
		);
	});
});

// Creates a Payment Method (Credit Card)
// Example: createPaymentMethod.post().form({})
exports.createPaymentMethod = functions.https.onRequest((req, res) => {

	return cors(req, res, () => {

		const data = JSON.parse(req.body);

		stripe.paymentMethods.create({
				type: 'card',
				card: {
					number: data.number,
					exp_month: data.exp_month,
					exp_year: data.exp_year,
					cvc: data.cvc,
				},
			},
			function (err: any, customer: any) {
				if (customer) {
					res.status(200).send(customer);
				} else {
					res.status(err.statusCode).send(err.message);
					reportError(err);
				}
			}
		);
	});
});

const createSubscription = function(req: any, res: any, customerId: String, quantity: Number) {
  		return stripe.subscriptions.create({
  				customer: customerId,
  				items: [{
  					plan: "plan_H3OETyrqerFG9r",
  					quantity: quantity
  				}],
  				collection_method: "send_invoice",
  				days_until_due: 30
  			},
  			function (err: any, paymentIntent: any) {
  				if (paymentIntent) {
  					console.log("the paymentIntent response: " + paymentIntent);
  					res.status(200).send(paymentIntent);
  				} else {
  					res.status(err.statusCode).send(err.message);
  					reportError(err);
  				}
  			}
  		);
}

// Creates a customer
// Example: createCustomer.post().form({email: "darran7777777@gmail.com", description: "Android Engineer", name: "Darran Kelinske", phone: "512-693-7499", address: {line1: "1101 Hollow Creek", line2: "#2210", city: "Austin", state:"TX"}})
exports.createCustomerAndSubscription = functions.https.onRequest((req, res) => {
	return cors(req, res, () => {

		const data = JSON.parse(req.body);

		stripe.customers.create({
				email: data.email,
				description: data.description,
				name: data.name,
				phone: data.phone,
				payment_method: data.payment_method,
				address: {
					line1: data.address.line1,
					line2: data.address.line2,
					city: data.address.city,
					state: data.address.state
				}
			},
			function (err: any, customer: any) {
				if (customer) {
					return createSubscription(req, res, customer.id, data.quantity);
				} else {
					res.status(err.statusCode).send(err.message);
					reportError(err);
				}
			}
		);
	});
});



// Create a Subscription
// Example: createSubscription.post().form({customer: "cus_H1WCQY1BTpQrq1", quantity: 7})
exports.createSubscription = functions.https.onRequest((req, res) => {

	return cors(req, res, () => {

		const data = JSON.parse(req.body);

		return createSubscription(req, res, data.customerId, data.quantity);

	});
});




// Attach a payment to a customer
// Example: attachPaymentToCustomer.post().form({paymentId: "pm_1GQlt6Gcfq2ACyKQ8dLzesOQ", customerId: "cus_GyjPbiztjArVD9"})
exports.attachPaymentToCustomer = functions.https.onRequest((req, res) => {

	const data = JSON.parse(req.body);

	stripe.paymentMethods.attach(
		data.paymentId, {
			customer: data.customerId
		},
		function (err: any, customer: any) {
			if (customer) {
				res.status(200).send(customer);
			} else {
				reportError(err);
			}
		}
	);
});

// Create a Payment Intent. Currently accepts amount and currency
// Example: createPaymentIntent.post().form({amount: 777, currency: "usd"})
exports.createPaymentIntent = functions.https.onRequest((req, res) => {

	stripe.paymentIntents.create({
			amount: req.body.amount,
			currency: req.body.currency,
			payment_method_types: ['card'],
		},
		function (err: any, paymentIntent: any) {

			if (paymentIntent) {
				console.log("the paymentIntent response: " + paymentIntent);
				res.status(200).send(paymentIntent);
			} else {
				reportError(err);
			}
		}
	);
});


// To keep on top of errors, we should raise a verbose error report with Stackdriver rather
// than simply relying on console.error. This will calculate users affected + send you email
// alerts, if you've opted into receiving them.
// [START reporterror]
function reportError(err: any, context = {}) {
	console.log(err);
}
// [END reporterror]

