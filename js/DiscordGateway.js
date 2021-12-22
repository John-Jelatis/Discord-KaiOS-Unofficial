// temporary
function debug() {
	// console.log('[gateway] ' + Array.from(arguments).join('\t'));
}

function DiscordGateway() {
	this.token = null;
	this.ws = null;
	this.persist = null;

	this.events = { };
}

DiscordGateway.prototype.streamURL = 'wss://gateway.discord.gg/?v=9&encoding=json';

DiscordGateway.prototype.addEventListener = function(name, callback) {
	this.events[name] = callback;
};

DiscordGateway.prototype.emit = function(name, data) {
	if(name in this.events) this.events[name].apply(this, [ data ]);
};

DiscordGateway.prototype.login = function(token) {
	this.token = token;
};

DiscordGateway.prototype.send = function(data) {
	this.ws.send(JSON.stringify(data));
};

DiscordGateway.prototype.handlePacket = function(message) {
	var packet = JSON.parse(message.data);

	debug('Handling packet with OP ' + packet.op + '...');

	var callbacks = {
		 0: this.handlePacketDispatch,
		 9: this.handlePacketInvalidSess,
		10: this.handlePacketGatewayHello,
		11: this.handlePacketAck
	};

	if(packet.op in callbacks) callbacks[packet.op].apply(this, [ packet ]);
	else debug('OP ' + packet.op + 'not found!')
};

DiscordGateway.prototype.handlePacketDispatch = function(packet) {
	this.persist.sequence_num = packet.s;
	debug('dispatch:', JSON.stringify(packet,null,4));
	switch(packet.t) {
		case 'MESSAGE_CREATE': {
			this.emit('message', packet.d);
			break;
		}
	}
};

DiscordGateway.prototype.handlePacketInvalidSess = function(packet) {
	debug('sess inv:', JSON.stringify(packet,null,4));
	this.ws.close();
};

DiscordGateway.prototype.handlePacketGatewayHello = function(packet) {
	var self = this, ws = this.ws;

	debug('Sending initial heartbeat...');
	self.send({
		'op': 1, // HEARTBEAT
		'd': self.persist.sequence_num || null
	});

	var interval = setInterval(function() {
		if(ws != self.ws) return clearInterval(interval);
		debug('Sending heartbeat...');

		self.send({
			'op': 1, // HEARTBEAT
			'd': self.persist.sequence_num || null
		});
	}, packet.d.heartbeat_interval);
};

DiscordGateway.prototype.handlePacketAck = function(packet) {
	if(this.persist.authenticated) return;

	this.persist.authenticated = true;
	this.send({
		"op": 2,
		"d": {
			"status": "online",
			"token": this.token,
			"intents": 0b11111111111111111,
			"properties": {
				"$os": "Android",
				"$browser": "Discord Android",
				"$device": "phone"
			}
		}
	});
};

DiscordGateway.prototype.init = function() {
	if(!this.token) throw Error('You need to authenticate first!');

	var self = this;

	this.persist = { };

	debug('Connecting to gateway...');
	this.ws = new WebSocket(this.streamURL);

	this.ws.addEventListener('message', this.handlePacket.bind(this));
	this.ws.addEventListener('open', function() {
		debug('Sending Identity [OP 2]...');
	});
	this.ws.addEventListener('close', function(evt) {
		self.emit('close', evt);
	});
};
