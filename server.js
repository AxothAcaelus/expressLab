var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser());

var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');

var basicAuth = require('basic-auth-connect');
var auth = basicAuth(function(user, pass) {
    return((user ==='cs360')&&(pass === 'test'));
});


var options = {
	host: '*.axoth.us',
	key: fs.readFileSync('ssl/server.key'),
	cert: fs.readFileSync('ssl/server.crt')
};

http.createServer(app).listen(8080);
https.createServer(options, app).listen(443);

app.all('/', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

app.use('/', express.static('./html', {maxAge: 60*60*1000}));

app.get('/getcity', function (req, res) {
	console.log('GET: getcity');
	var urlObj = url.parse(req.url, true, false);
	var regex = new RegExp("^" + urlObj.query.city);
    var jsonResponse = [];

    fs.readFile('./files/utahCities.dat.txt', function (err, data) {
      
     	if(err) throw err;
      	var cities = data.toString().split("\n");
      	for(var i = 0; i < cities.length; i++) {
        	var result = cities[i].search(regex);
	        if(result != -1) {

    	    	jsonResponse.push({city:cities[i]});
        	
        	}

     	}
    	res.json(jsonResponse);
    });    
});

app.get('/comment', function (req, res) { 
	console.log("GET: Comments");
	var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect("mongodb://localhost/weather", function(err, db) {
        if(err) throw err;
        db.collection("comments", function(err, comments){
    	    if(err) throw err;
        	comments.find(function(err, items){
            	items.toArray(function(err, itemArr) {
              		res.json(itemArr);
            	});
          	});
        });
    });
}); 

app.post('/comment', auth, function (req, res) {
	console.log("POST: Comment");
    console.log(req.user);
    console.log("Remote User");
    console.log(req.remoteUser);
	console.log(req.body); 

    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect("mongodb://localhost/weather", function(err, db) {
    	if(err) throw err;
    	db.collection('comments').insert(req.body, function(err, records) {
      		console.log("Record added as " + records[0]._id);
    	});
    });
	res.status(200); 
	res.end(); 
});