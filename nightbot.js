var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

mongoose.connect('mongodb://localhost/nightbot');

var db = mongoose.connection;

autoIncrement.initialize(db);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  	// yay!
  	console.log("mongoose loaded");
  	process.argv.forEach(function(val,index,array) {
  		if(index == 2)
  		{
  			if(val == "register")
  			{
  				var axx = require('./bot_modules/access');
  				axx.registerUser(array[3], array[4], axx.AccessEnum.ADMIN | axx.AccessEnum.USECOMMANDS | axx.AccessEnum.EDITUSERS, null, function(){
  					console.log("Seeded root user");
  				});
  				return;
  			}
  		}
  	});
  	bootstrap();
});


var config = 
{
	channels: ["#flux"],
	server: "irc.flux.cd",
	botName: "KawaiiBot"
}

var irc = require("irc");

var moduleList = ['access', 'quotes'];
// i should fix this

var bot = new irc.Client(config.server, config.botName,{
	channels: config.channels
});


var LoadedModules = {};

var LoadModule = function(moduleName)
{
	try
		{
			LoadedModules[moduleName] = require("./bot_modules/" + moduleName);
			LoadedModules[moduleName].init(CommandCenter);
			return true;
		}
		catch(err)
		{
			console.error(err);
			return false;
		}
}

var nukeHandler = function(irc, from, to, text, message)
{
	var commands = text.split(" ");
	if(commands.length <= 1)
	{
		irc.say(to, "You must specify something to obliterate.");
	}
}

var joinHandler = function(irc, from, to, text, message)
{
	var commands = text.split(" ");

	var access = CommandCenter.getModule('access');
	access.userRegistration(message.user, message.host, function(res)
	{
		if(res && (res.permissions & access.AccessEnum.ADMIN))
		{
			irc.join(commands[1], function(){});
		}
		else
		{
			irc.notice(from, "You don't have permission to do that.");
		}
	});
}
 var partHandler = function(irc, from, to, text, message)
 {
	var commands = text.split(" ");
	var access = CommandCenter.getModule('access');
	access.userRegistration(message.user, message.host, function(res)
	{
		if(res && (res.permissions & access.AccessEnum.ADMIN))
		{
			if(commands.length > 1)
				irc.part(commands[1]);
			else
			{
				irc.part(to);
			}
		}
		else
		{
			irc.notice(from, "You don't have permission to do that.");
		}
	});
 }

 var quitHandler = function(irc, from, to, text, message)
 {
 	var commands = text.split(" ");
	var access = CommandCenter.getModule('access');
	access.userRegistration(message.user, message.host, function(res)
	{
		if(res && (res.permissions & access.AccessEnum.ADMIN))
		{
			irc.disconnect("Sayonara!");
		}
		else
		{
			irc.notice(from, "You don't have permission to do that.");
		}
	});
 }

 var listCommandsHandler = function(irc, from, to, text, message)
 {
 	var commands = [];
 	for (var k in RegisteredCommands) commands.push(k);
 	irc.say(to[0] == "#" ? to : from, commands.join(", "));
 }

var RegisteredCommands = 
{
	'.nuke': nukeHandler,
	'.join': joinHandler,
	'.part': partHandler,
	'.quit': quitHandler,
	'.commands' : listCommandsHandler
}


var CommandCenter = 
{
	getModule: function(moduleName)
	{
		if(moduleName in LoadedModules)
		{
			return LoadedModules[moduleName];
		}
		else
		{
			return null;
		}
	},
	registerCommand: function(command, callback)
	{
		RegisteredCommands[command] = callback;
	},
	unregisterCommand: function(command)
	{
		delete RegisteredCommands[command];
	},
	hookCommand: function(command, callback)
	{
		if(RegisteredCommands[command] instanceof Array)
			RegisteredCommands[command].push(callback)
		else if(RegisteredCommands[command] instanceof Function)
			RegisteredCommands[command] = [RegisteredCommands[command], callback];
		else
			this.registerCommand(command, callback);
	},
	unhookCommand: function(command, callback)
	{
		var idx = RegisteredCommands[command].indexOf(callback);
		RegisteredCommands[command].splice(idx, 1);
	}
}

for(var i = 0; i < moduleList.length; ++i)
{
	LoadModule(moduleList[i]);
}


var bootstrap = function()
{
	// entry point for everything essentially

	bot.addListener("message", function(from, to, text, message)
	{
		var commands = text.split(" ");
		var handler = RegisteredCommands[commands[0]];
		if(handler != null)
		{
			if(handler instanceof Array)
			{
				for (var i = 0; i < handler.length; ++i) {
					var func = handler[i];
					func(bot, from, to, text, message);
				};
			}
			else if(handler instanceof Function)
			{
				handler(bot,from,to,text,message);
			}
		}
	});

	bot.addListener('error', function(message) {
    	console.log('error: ', message);
	});
}