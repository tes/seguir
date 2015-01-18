var express = require('express'),
    api = require('../index'),
    Base62 = require('base62'),
    exphbs  = require('express-handlebars');

var app = express();

app.engine('.hbs', exphbs({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: 'example/views/layouts/'
}));
app.set('view engine', '.hbs');
app.set('views', 'example/views')

app.get('/', function (req, res) {
  var start = req.query.start;
  api.get.getFeedForUsername('cliftonc', start, 50, function(err, feed, maxTime) {
    res.render('index', {feed: feed, start: maxTime});
  });
});

app.get('/my-feed/:user', function (req, res) {
  res.end('MY FEED: ' + req.params.user);
});

app.get('/like/:user/:item', function (req, res) {
  api.get.checkLike(req.params.user, req.params.item, function(err, like) {
      res.json(like);
  });
});

app.get('/user/:username', function (req, res) {
  api.get.getUserByUsername(req.params.username, function(err, user) {
      res.json(user);
  });
});

app.get('/post/:post', function (req, res) {
  api.get.getPost(req.params.post, function(err, post) {
      res.json(post);
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
});
