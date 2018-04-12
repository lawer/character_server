var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');


var dbUrl = "mongodb://dbuser:dbuser@ds213759.mlab.com:13759/characters?authMechanism=SCRAM-SHA-1";
const db = require('monk')(dbUrl);

const characters = db.get('characters');
const users = db.get('users');

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
opts.secretOrKey = "ARRIQUITAN";

passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
  users.findOne({"_id": jwt_payload._id})
    .then(function (user) {
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    }).catch(function (error) {
    console.log("ERROR " + error);
  });
}));


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

app.post('/api/auth/register', function (req, res) {
  var data = req.body;

  if (!data.username || !data.password) {
    res.json({success: false, msg: 'Please pass username and password.'});
  } else {
    users.findOne({username: data.username})
      .then(function (user) {
        console.log(user);

        if (!user) {
          users.insert(data);
          return res.json({success: true, msg: 'User created.'});
        } else {
          return res.json({success: false, msg: 'Username already exists.'});
        }
      });
  }
});

app.post('/api/auth/login', function (req, res) {
  var data = req.body;

  users.findOne({username: data.username})
    .then(function (user) {
      console.log(user);
      if (!user) {
        res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        if (user.password === data.password) {
          var token = jwt.sign(
            {
              "_id": user._id,
              "username": user.username
            },
            opts.secretOrKey
          );
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      }
    })
});


app.get('/api/characters', function (req, res) {
  characters.find({})
    .then(function (data) {
      console.log(data);
      res.json({characters: data});
    }).catch(function (error) {
    console.log(error);
  });
});

app.post('/api/characters', function (req, res) {
  var data = req.body;

  characters.insert(data)
    .then(function (data) {
      res.json({characters: data});
    }).catch(function (error) {
    console.log(error);
  });
});

app.get('/api/characters/:id', function (req, res) {
  var _id = req.params.id;

  characters.find({"_id": _id})
    .then(function (data) {
      res.json(data);
    }).catch(function (error) {
    console.log(error);
  });
});


app.post('/api/characters/:id', function (req, res) {
  var _id = req.params.id;
  var data = req.body;

  characters.update({"_id": _id}, data)
    .then(function (data) {
      res.json(data);
    }).catch(function (error) {
    console.log(error);
  });
});


app.delete('/api/characters/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
  if (req.user) {
    console.log(req.user.username)

    var _id = req.params.id;

    console.log(_id)
    characters.remove({_id: _id})
      .then(function (data) {
        console.log("ENTRA")

        res.json(data);
      }).catch(function (error) {
      console.log("ERROR " + error);
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
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
