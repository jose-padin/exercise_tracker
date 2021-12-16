const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const mongoose = require('mongoose');
const db = mongoose.connect(MONGO_URI);
const User = require('./models/user');
const { query } = require('express');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


app.get('/api/users/:username', (req, res) => {
  const { username } = req.params;
  if (username) {
    User.findOne({username: username}, (err, user) => {
      return res.json({username: user.username, _id: user._id});
    })
  }
})


app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const req_url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  if (username) {
    User.findOne({username: username}, (err, user) => {
      if (err) return res.redirect(req_url);
      if (user) {
        return res.send('Username already taken');
      } else {
        let user = new User({username: username});
        user.save((err, savedUser) => {
          if (!err) {
            return res.json({username: savedUser.username, _id: savedUser._id})
          }
        })
      }
    })
  }
});


app.get('/api/users', (req, res) => {
  let payload = [];

  User.find({}, (err, users) => {
    for (let user of users) {
      payload.push({username: user.username, _id: user._id});
    }

    return res.send(payload);
  })
})


app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;

  if (_id && description && duration) {
    date ? dateObj = new Date(date) : dateObj = new Date();

    User.findOneAndUpdate(
      {_id: _id},
      {
        $push: {
          log: {
            description: description,
            duration: parseInt(duration),
            date: dateObj
          }
        }
      },
      {new: true})
      .then(updadedtUser => {
        res.json({
          username: updadedtUser.username,
          description: updadedtUser.log[updadedtUser.log.length - 1].description,
          duration: updadedtUser.log[updadedtUser.log.length - 1].duration,
          date: updadedtUser.log[updadedtUser.log.length - 1].date.toDateString(),
          _id: updadedtUser._id
        })
      }).catch(err => {
        return console.log(err);
      });
    }
  })


app.get('/api/users/:_id/logs', (req, res) => {
  const req_url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const { _id } = req.params;
  let { from, to, limit } = req.query;
  let query;
  let returnedObj = {};

  if (from) {
    from = new Date(from);
  }

  if (to) {
    to = new Date(to);
  }

  if (limit) {
    limit = +limit;
  }

  if (_id) {
    if (from && to) {
      query = User.find({_id: _id, 'log.date': {$gte: from, $lte: to}});
    } else if (from && !to) {
      query = User.find({_id: _id, 'log.date': {$gte: from}});
    } else if (to && !from) {
      query = User.find({_id: _id, 'log.date': {$lte: to}});
    } else {
      query = User.find({_id: _id});
    }

    if (limit) query = query.limit(limit);

    User.findOne(query, (err, user) => {
      if (err) return res.redirect(req_url);

      if (user) {
        returnedObj['username'] = user.username;
        let limitedLogs = user.log.slice(0,limit);
        let logs = [];

        limitedLogs.forEach((obj) => {
          let exercise = {};
          exercise.description = obj.description;
          exercise.duration = obj.duration;
          exercise.date = obj.date.toDateString();
          logs.push(exercise);
        })
        returnedObj['_id'] = user._id;
        returnedObj['count'] = logs.length;
        returnedObj['log'] = logs;

        return res.json(returnedObj);
      } else {
        console.log(err);
        return res.redirect(req_url);
      }
    })
  }
});


const listener = app.listen(process.env.PORT || 3005, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
