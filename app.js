
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , twitter = require('ntwitter')
  , io = require('socket.io')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , app = express()
  , server = http.createServer(app)
  , io = io.listen(server);

//Connect Mongoose database, store in 'mailinglist'
mongoose.connect('mongodb://localhost/mailinglist');

//Create shortcuts for Schema and ObjectId
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

//'mailer' will be the new Schema, feel free to add or subtract
var mailer = new Schema({
  name: String,
  email: String
});

//'entry' will be my model to store the info
var entry = mongoose.model('entry', mailer);

//here you need to put in all your twitter credentials, get them from the dev twitter website
var twit = new twitter({
  consumer_key: 'Your info here',
  consumer_secret: 'Your info here',
  access_token_key: 'Your info here',
  access_token_secret: 'Your info here'
});

//all the config...
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

//using development error handlers
app.configure('development', function(){
  app.use(express.errorHandler());
});

/*The next part involves twitter, I have integrated both search and
stream functions because when you have a keyword that is not so actively
tweeted but you still want it to be live and also have some historical 
tweets, this is my "figured out" method*/

//these are global variables to get the first three tweets in 'search'
var myText= [];
var myHandle= [];
var myName= [];
var myPics= [];
var count= [0,1,2];

//this whole part here... you can probably write better than me, but none-the-less, it works
function twitSearch(){
  twit.search ('perkos OR perko\'s', {}, function(err, data){
      console.log(data);
      myText= [];
      myHandle= [];
      myName= [];
      myPics= [];
      for (var i = 0; i<3; i++){
        myText.push(data.results[i].text);
        myName.push(data.results[i].from_user_name);
        myPics.push(data.results[i].profile_image_url);
        myHandle.push(data.results[i].from_user);
      }
  })
}

//here is the streaming function.  It coordinates with socket.io to send info to the client side
twit.stream('statuses/filter', { track: ['perkos'] }, function(stream) {
  stream.on('data', function (data) {
    io.sockets.volatile.emit('tweet', {
      name: data.user.name,
      text: data.text,
      pics: data.user.profile_image_url,
      handle: data.user.screen_name
    });
  });
});

//this is the AJAX part.  this sends the first three tweets to the frontend
app.get('/twitter', function(req,res){
  twitSearch();
  setTimeout(function() {
    res.writeHead(200, {'content-type': 'text/json' });
    res.write( JSON.stringify({
      text: myText,
      name: myName,
      pics: myPics,
      handle: myHandle,
      count: count
    }))
    res.end('\n');
  }, 300);
})

//this is also AJAX, takes the info from form and saves it to database
app.post('/mailer', function(req,res){
  //create new entry for mongoDB
  var Entry = new entry({
    //variables from form
    name: req.body.name,
    email: req.body.email
  }).save(function(err){
    //after save options
    if (err){
      console.log(err);
    }
    if(!err){
      console.log("just saved:" + req.body.name + " " + req.body.email);
    }
  })
})

//initial page feed
app.get('/', function(req,res){
  res.render('index',{
    title: 'Somewhere Restaurant',
  })
});

//start server
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});