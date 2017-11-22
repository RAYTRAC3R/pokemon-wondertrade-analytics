if(process.env.NODE_ENV !== 'DEVELOPMENT') {
	require('newrelic');
}

// Super cheaty patch
process.env.REDISTOGO_URL = process.env.REDISCLOUD_URL;

var express = require('express'),
	ejs = require('ejs'),
	engine = require('ejs-locals'),
	app = express(),
	passport = require("passport"),
	LocalStrategy = require('passport-local').Strategy,
    HerokuRedisStore = require('connect-heroku-redis')(express),
    MemoryStoreModel = require("./models/MemoryStore"),
	redisEnvUrl = process.env.REDISCLOUD_URL,
	REFRESH_CHARTS_RATE = 1800000, // 30 minutes
    MemoryStore,
	dataStore;

// Useful debugger:
// var webkitDevtoolsAgent = require("webkit-devtools-agent");

process.env.TZ = 'America/Chicago';
process.setMaxListeners(0);

// If REDIS_TOGO is available (Heroku box)
if (redisEnvUrl) {
	var redis = require('redis');
	var url = require('url');
	var redisURL = url.parse(redisEnvUrl);
	dataStore = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
	dataStore.auth(redisURL.auth.split(":")[1]);
} else {	
	dataStore = require("redis").createClient();
}

MemoryStore = new MemoryStoreModel(dataStore);
MemoryStore.refreshHighCharts();
setInterval(function(){
    MemoryStore.refreshHighCharts();
}, REFRESH_CHARTS_RATE);

app.configure(function() {
	app.engine('ejs', engine);
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.set('view engine', 'ejs');
	app.set('views', __dirname + '/views');
	app.use(express.session({ secret: 'keyboard cat times eleven',store: new HerokuRedisStore() }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.static(__dirname + '/public'));
});

// Init Home Controller
(require('./controllers/home'))(app, dataStore, MemoryStore);

// Init WonderTrade Controller
(require('./controllers/wondertrade'))(app, dataStore, passport, MemoryStore);

// Init Data Controller
(require('./controllers/data'))(app, dataStore, MemoryStore);

// Init User Authentication Controller
(require('./controllers/authentication'))(app, dataStore, passport, LocalStrategy);

// Init Admin Controller
(require('./controllers/admin'))(app, dataStore);


// After all other routes are init, we can now check for 404s.
app.use(function(req, res, next){  
  res.render('404', { status: 404, url: req.url, title: '404, Page Not Found', user: req.user, stateMessage: '', pageState: '' });
});

app.use(function(error, req, res, next) {
	console.log(req.originalUrl, ':', error.stack);
	res.render('500', { status: 500, url: req.url, title: 'Something broke :(', user: req.user, stateMessage: '', pageState: '' });
});


var serverPort = process.env.PORT || 5000;
app.listen(serverPort, function(){
	console.log('Listening on port '+serverPort+'..');
});