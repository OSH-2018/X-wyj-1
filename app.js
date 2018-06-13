global.window = global.document = global;

var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io").listen(server);


app.get('/', function (req, res) {
	res.sendFile('/index.html', {root: __dirname});
});

app.get('/*', function (req, res, next) {
	var file = req.params[0];
	res.sendFile(__dirname + '/' + file);
	
});


io.on("connection", function (socket) {

	socket.on('join', function (status) {
		
	});
	
	socket.on('message', function (msg) {
		//TODO
	});
	
	
	socket.on("disconnect", function () {
		//TODO
	});
	
});

server.listen(4004, function () {
	console.log("listening on *:4004");
});
