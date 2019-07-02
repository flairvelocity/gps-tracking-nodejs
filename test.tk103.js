const gps = require("./index");

const options = {
	'debug': true,
	'port': 8092,
	'device_adapter': "TK103"
}



const server = gps.server(options, function (device, connection) {
    /*	Available device variables:
		----------------------------
		device.uid -> Set when the first packet is parsed
		device.name -> You can set a custon name for this device.
		device.ip -> IP of the device
		device.port --> Device port
	*/

    /******************************
	LOGIN
	******************************/
	device.on("login_request", function (device_id, msg_parts) {
		//Do some stuff before authenticate the device...
		// This way you can prevent from anyone to send their position without your consent
		this.login_authorized(true); //Accept the login request.
	});

	device.on("login", function () {
		console.log("Hi! i'm " + device.uid);
	});

	device.on("login_rejected", function () {
		console.log("Login rejected");
	});

	device.on("ping", function (data) {
		//After the ping is received
		console.log("PING", data);
		// console.log("I'm here now: " + gps_data.latitude + ", " + gps_data.longitude);
		return data;
	});

	device.on("alarm", function (alarm_code, alarm_data, msg_data) {
		// console.log('alarm', alarm_code, alarm_data, msg_data)
		// console.log("Help! Something happend: " + alarm_code + " (" + alarm_data.msg + ")");
		//call_me();
	});

	device.on("handshake", function () {
		console.log('handshake')
	});

});