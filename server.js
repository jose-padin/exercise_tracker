const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const mongoose = require('mongoose');
const db = mongoose.connect(MONGO_URI);
const User = require('./models/user');
const Exercise = require('./models/exercise');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


app.get('/api/users/:username', (req, res) => {
  const username = req.params.username;
  if (username) {
    User.findOne({username: username}, (err, user) => {
      return res.json({username: user.username, _id: user._id});
    })
  }
})


app.get('/api/users/:_id/exercises', (req, res) => {
  const req_url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const _id = req.params._id;

  if (_id) {
    User.findOne({_id: _id}, (err, user) => {
      if (err) return res.redirect(req_url);
      let log = [];

      if (user) {
        Exercise.find({userId: user._id}, (err, exercises) => {
          if (err) return res.redirect(req_url);

          for (let exercise of exercises) {
            log.push({
              description: exercise.description,
              duration: exercise.duration,
              date: exercise.date
            });
          }

          return res.json({
            username: user.username,
            log: log
          });
        })
      }
    })
  }
})


app.post('/api/users', (req, res) => {
  const req_url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const username = req.body.username;

  if (username) {
    let user = new User({username: username});
    user.save((err, savedUser) => {
      if (!err) {
        return res.json({username: savedUser.username, _id: savedUser._id})
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
  const req_url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const user_id = req.body._id;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;


  if (user_id && description && duration) {
    if (!date) date = new Date();

    User.findOne({_id: user_id}, (err, user) => {
      if (err) return res.redirect(req_url);

      if (user) {
        let exercise = new Exercise({
          userId: user._id,
          description: description,
          duration: duration,
          date:date
        });

        exercise.save((err, savedExercise) => {
          if (err) {
            return res.redirect(req_url);
          }

          if (!err) {
            return res.send({
              user: user,
              description: savedExercise.description,
              duration: savedExercise.duration,
              date: savedExercise.date
            })
          }
        })
      }
    })
  }
});


app.get('/api/users/:_id/logs', (req, res) => {
  const req_url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const user_id = req.params._id;
  const query_params = req.query;
  const count_query_params = Object.keys(req.query).length;
  let date_from;
  let date_to;
  let limit;

  if (count_query_params) {
    date_from = query_params['from'];
    date_to = query_params['to'];
    limit = query_params['limit'];

    if (limit) {
      limit = parseInt(limit);
    } else {
      limit = 0;
    }
  }

  if (user_id) {
    User.findOne({_id: user_id}, (err, user) => {
      if (err) return res.redirect(req_url);

      if (user) {
        let query;
        if (date_from && date_to) {
          query = Exercise.find({userId: user._id, date: {$gte: date_from, $lte: date_to}});
        } else if (date_from && !date_to) {
          query = Exercise.find({userId: user._id, date: {$gte: date_from}});
        } else if (date_to && !date_from) {
          query = Exercise.find({userId: user._id, date: {$lte: date_to}});
        } else {
          query = Exercise.find({userId: user._id});
        }

        query.limit(limit).exec((err, exercises) => {
          if (err) return res.redirect(req_url);

          let log = [];
          for (let exercise of exercises) {
            let _date = exercise.date;
            if (exercise.date) {
              _date = exercise.date.toDateString();
            }

            log.push({
              description: exercise.description,
              duration: exercise.duration,
              date: _date
            });
          }

          return res.json({
            username: user.username,
            count: exercises.length,
            _id: user._id,
            log: log
          })
        })
      } else {
        return res.redirect(req_url);
      }
    });
  }
});


const listener = app.listen(process.env.PORT || 3005, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
