var net = require('net');

var client = new net.Socket();

client.connect(8092, '127.0.0.1', function() {
	console.log('Connected');
	client.write('(009205906401BP05000009205906401190629A2321.5726N08518.8931E000.01027100.000001000000L076864EE)');
});

client.on('data', function(data) {
	console.log('Received: ' + data);
	setInterval(function(){
		client.write('(009205906401BR00190629A2321.5729N08518.8934E000.01033420.000001000007L076864EE)');
	}, 20000);
});

client.on('close', function() {
	console.log('Connection closed');
});

