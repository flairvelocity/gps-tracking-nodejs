var net = require('net');

var client = new net.Socket();

client.connect(8091, '127.0.0.1', function() {
	console.log('Connected');
	client.write('78780d010358735074484832000727db0d0a');
});

client.on('data', function(data) {
	console.log('Received: ' + data);
	setInterval(function(){
		client.write('78781f121306170e181acf0281978009273e0000544c019534064b0079fc0469d9920d0a');
	}, 20000);
});

client.on('close', function() {
	console.log('Connection closed');
});

