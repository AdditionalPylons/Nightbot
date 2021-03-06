var https = require('https');
var querystring = require('querystring');

function requestAccessToken(refresh_token, client_id, client_secret, callback)
{
	var post_data = querystring.stringify(
	{
		'refresh_token' : refresh_token,
		'client_id' : client_id,
		'client_secret' : client_secret,
		'grant_type' : 'refresh_token'
	});

	var post_options = {
		host: 'api.imgur.com',
		path: '/oauth2/token',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
        	'Content-Length': post_data.length
		}
	}

	var post_req = https.request(post_options, function(res)
	{
		res.setEncoding('utf8');
		res.on('data', function(data)
		{
			callback(JSON.parse(data));
		})
	});

	post_req.write(post_data);
	post_req.end();
}

exports.requestAccessToken = requestAccessToken;

function uploadImage (url, album_id, access_token, callback) {
	var post_data = querystring.stringify({
		'image' : url,
		'album' : album_id,
		'type' : 'URL'
	});

	var post_options = {
		host: 'api.imgur.com',
		path: '/3/image',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
        	'Content-Length': post_data.length,
        	'Authorization' : 'Bearer ' + access_token
		}
	}

	var post_req = https.request(post_options, function(res)
	{
		res.setEncoding('utf8');
		var data = "";
		res.on('data', function(chunk)
		{
			data += chunk;
		});
		res.on('end', function()
		{
			callback(JSON.parse(data));
		});
	});

	post_req.write(post_data);
	post_req.end();
}

exports.uploadImage = uploadImage;