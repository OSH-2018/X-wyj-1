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

var CRDT = require("./crdt.js");
var C = CRDT();
var lamport = 1;
var admin = 0;
var user = 0;
var active = 0;
var sockets = [];
var users = [];

io.on("connection", function (socket) {

	socket.on('join', () => {
		socket.emit('accept', user);
		users[user] = user === admin ? 'admin' : 'guest';
		socket.site = user;
		sockets[user] = socket;
		user = user + 1;
		active = active + 1;


		let initChars = [];
		C.crdt.forEach(line => line.forEach(char => initChars.push(["add",char])));
		socket.emit('init', initChars);
		io.emit('users', JSON.stringify(users));
	});
	
	socket.on('sendChange', function (obj) {
		lamport = Math.max(obj.lamport, lamport) + 1;
		C.updateAndConvertRemoteToLocal(obj.change);
		sockets.forEach(_socket => {
			if (_socket.site !== socket.site)
				_socket.emit('recvChange', obj);
		});
	});
	
	
	socket.on('disconnect', function () {
		if (active > 1) {
			active = active - 1;
			if (admin === socket.site) {
				admin = users.findIndex(s => s === 'guest');
				users[admin] = 'admin';
			}
			delete sockets[socket.site];
			delete users[socket.site];
		} else {
			admin = 0;
			user = 0;
			active = 0;
			sockets = [];
			users = [];
			active = 0;
		}
		io.emit('users', JSON.stringify(users));
	});
	
});

server.listen(4004, function () {
	console.log("listening on port:4004");
});


