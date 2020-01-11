const request = require('request')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json());
const port = 3001

function Communication(config) {
	this.receivers = {};
	this.config = config;
}

function ReceiveScope(comm, source, choreography) {
	this.comm = comm;
	this.source = source;
	this.choreography = choreography;
	if (!this.comm.receivers.hasOwnProperty(choreography)) {
		this.comm.receivers[choreography] = {}
	}
	this.comm.receivers[choreography][source] = null;
}

ReceiveScope.prototype.registerReceiveFn = function (receiveFn) {
	this.comm.receivers[this.choreography][this.source] = receiveFn;
	if (this.comm.config.recvSeams[this.choreography][this.source] == "rest") {
		var listener = this.comm.config.restUrls[this.choreography][this.source];
		console.log("Creating listener on ", listener);
		app.post(listener, function (req, res) {
			res.json(receiveFn(req.body));
		});
	}
};

Communication.prototype.receive = function (source, choreography, setupFn) {
	setupFn.apply(new ReceiveScope(this, source, choreography));
}

Communication.prototype.send = function (source, choreography, destination, payload) {
	// dispatch to a receiver
	var method = this.config.seams[source][destination];	
	if (method == "methodcall") {
		this.receivers[choreography][destination](payload);
	} else if (method == "rest") {
		request.post(this.config.names[destination] + this.config.restUrls[choreography][destination], {json: payload}, function (err, res, body) {
			if (err) { console.log(err) ; return }
			console.log("response", res.body);				
		});
	}
}

var communication = new Communication({
	"seams": {
		"app": {
			"orders": "rest"
		},
		"orders": {
			"restaurant_side": "methodcall"
		}
	},
	"recvSeams": {
		"contact-restaurant": {
			"orders": "rest",
			"restaurant_side": "methodcall"
		}
	},
	"names": {
		"app": "http://localhost:3001",
		"orders": "http://localhost:3001",
		"restaurant_side": "http://localhost:3001"
	},
	"restUrls": {
		"contact-restaurant": {
			"restaurant_side": "/restaurants",
			"orders": "/orders"
		}
	}

});

communication.receive('restaurant_side', 'contact-restaurant', function setup(error) {
	var receiveFn = function (payload) {
		console.log("restaurant_side recv", payload);
		return {"messsage": "response from restaurant_side"};
	}
	this.registerReceiveFn(receiveFn);
});

// -> orders 
communication.receive('orders', 'contact-restaurant', function setup(error) {
	var receiveFn = function (payload) {
		console.log("orders recv", payload);
		communication.send('orders', 'contact-restaurant', 'restaurant_side', {"data": 1000});
		return {"message": "response from orders service"}
	}
	this.registerReceiveFn(receiveFn);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// from app -> orders
communication.send('app', 'contact-restaurant', 'orders', {
	restaurant: '1000'
});
