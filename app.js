var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

var index = require('./routes/index');
var users = require('./routes/users');

var db = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./db.db"
  }
});


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

/*
app.use('/', index);
app.use('/users', users);
*/

app.get('/api/characters', function (req, res) {
  db.select().from("characters")
    .then(function (data) {
      res.json({characters: data});
    }).catch(function (error) {
    console.log(error);
  });
});

app.post('/api/characters', function (req, res) {
  var data = req.body;

  db.insert(data).into("characters")
    .then(function (data) {
      res.json({characters: data});
    }).catch(function (error) {
    console.log(error);
  });
});

app.get('/api/characters/:id', function (req, res) {
  var id = parseInt(req.params.id);

  db.select().from("characters").where("id", id)
    .then(function (data) {
      res.json(data);
    }).catch(function (error) {
    console.log(error);
  });
});


app.post('/api/characters/:id', function (req, res) {
  var id = parseInt(req.params.id);
  var data = req.body;

  db("characters").update(data).where("id", id)
    .then(function (data) {
      res.json(data);
    }).catch(function (error) {
    console.log(error);
  });
});


app.delete('/api/characters/:id', function (req, res) {
  var id = parseInt(req.params.id);

  db.delete().from("characters").where("id", id)
    .then(function (data) {
      res.json(data);
    }).catch(function (error) {
    console.log(error);
  });
});

app.get('/rss', function (req, res) {
  db.select().from("characters")
    .then(function (data) {
      console.log(data);
      var rss =
`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">

  <channel>
    <title>GOT Characters</title>
    <link>localhost</link>
    <description>GOT Characters</description>`;

      for (var i = 0; i < data.length; i++) {
        rss += `
        <item>
          <title>${data[i].name}</title>
          <link>${data[i].image}</link>
          <description>${data[i].image}</description>
        </item>`;
      }

      rss += `
  </channel>
</rss>`;

      res.set('Content-Type', 'text/xml');
      res.send(rss);
    }).catch(function (error) {
    console.log(error);
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
