function DiscordXHR() {
	this.token = null;
}

DiscordXHR.prototype.baseURL = 'https://discord.com/api/v9/';
DiscordXHR.prototype.baseHeaders = {
	'content-type': 'application/json'
};

DiscordXHR.prototype.login = function(token) {
	this.token = token;
};

DiscordXHR.prototype.generateNonce = function() {
	return String(Date.now()*512*1024);
};

DiscordXHR.prototype.xhrRequest = function(method, path, headers, data) {
	var dataString = data instanceof Object ? JSON.stringify(data) : String(data);

	var xhr = new XMLHttpRequest({ 'mozAnon': true, 'mozSystem': true });
	xhr.open(method, this.baseURL + path, false);

	var o = Object.assign({ }, DiscordXHR.prototype.baseHeaders, headers);

	var hdrLs = Object.keys(o);
	for(var hdrIx = 0; hdrIx < hdrLs.length; ++ hdrIx) {
		xhr.setRequestHeader(hdrLs[hdrIx], o[hdrLs[hdrIx]]);
	}

	xhr.send(dataString);

	return xhr;
};

DiscordXHR.prototype.xhrRequestJSON = function() {
	var xhr = this.xhrRequest.apply(this, arguments);
	return JSON.parse(xhr.responseText);
};

DiscordXHR.prototype.sendMessage = function(channel, message) {
	return this.xhrRequestJSON('POST', 'channels/' + channel + '/messages', {
		'authorization': this.token
	}, {
		'content': message,
		'nonce': this.generateNonce()
	});
};

DiscordXHR.prototype.getAvatarURL = function(userID, avatar) {
	avatar = avatar || this.getProfile(userID).user.avatar;

	return 'https://cdn.discordapp.com/avatars/' + userID + '/' + avatar + '.png?size=24';
};

DiscordXHR.prototype.getChannel = function(channelID) {
	return this.xhrRequestJSON('GET','channels/' + channelID, {
		'authorization': this.token
	});
};

DiscordXHR.prototype.getChannels = function(base) {
	return this.xhrRequestJSON('GET',base + '/channels', {
		'authorization': this.token
	});
};

DiscordXHR.prototype.getChannelsDM = function() {
	return this.getChannels('users/@me');
};

DiscordXHR.prototype.getMessages = function(channel, count) {
	return this.xhrRequestJSON('GET', 'channels/' + channel + '/messages?limit=' + count, {
		'authorization': this.token
	});
};

DiscordXHR.prototype.getProfile = function(userID) {
	return this.xhrRequestJSON('GET', 'users/' + userID + '/profile', {
		'authorization': this.token
	});
};
