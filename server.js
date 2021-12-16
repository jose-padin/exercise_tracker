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
  const username = req.params.username;
  if (username) {
    User.findOne({username: username}, (err, user) => {
      return res.json({username: user.username, _id: user._id});
    })
  }
})


// TODO: redo
// app.get('/api/users/:_id/exercises', (req, res) => {
//   const req_url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
//   const _id = req.params._id;

//   if (_id) {
//     User.findOne({_id: _id}, (err, user) => {
//       if (err) return res.redirect(req_url);
//       let log = [];

//       if (user) {
//         Exercise.find({userId: user._id}, (err, exercises) => {
//           if (err) return res.redirect(req_url);

//           for (let exercise of exercises) {
//             log.push({
//               description: exercise.description,
//               duration: exercise.duration,
//               date: exercise.date
//             });
//           }

//           return res.json({
//             username: user.username,
//             log: log
//           });
//         })
//       }
//     })
//   }
// })


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
  const user_id = req.body._id;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;

  if (user_id && description && duration) {
    date ? dateObj = new Date(date) : dateObj = new Date();

    User.findOneAndUpdate(
      {_id: user_id},
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
      .then(updadetUser => {
        res.json({
          username: updadetUser.username,
          description: updadetUser.log[updadetUser.log.length - 1].description,
          duration: updadetUser.log[updadetUser.log.length - 1].duration,
          _id: updadetUser._id,
          date: updadetUser.log[updadetUser.log.length - 1].date.toDateString()
        })
      }).catch(err => {
        return console.log(err);
      });
    }
  })


// TODO: redo without Exercise
app.get('/api/users/:_id/logs', (req, res) => {
  const req_url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const user_id = req.params._id;
  const query_params = req.query;
  let date_from = query_params['from'];
  let date_to = query_params['to'];
  let limit = query_params['limit'] || 0;
  let query;
  let returnedObj = {};

  if (date_from) {
    date_from = new Date(date_from);
  }

  if (date_to) {
    date_to = new Date(date_to);
  }

  if (limit) {
    limit = parseInt(limit);
  }

  if (user_id) {
    if (date_from && date_to) {
      query = User.find({_id: user_id, 'log.date': {$gte: date_from, $lte: date_to}});
    } else if (date_from && !date_to) {
      query = User.find({_id: user_id, 'log.date': {$gte: date_from}});
    } else if (date_to && !date_from) {
      query = User.find({_id: user_id, 'log.date': {$lte: date_to}});
    } else {
      query = User.find({_id: user_id});
    }

    if (limit) query = query.limit(limit)

    User.findOne(query, (err, user) => {
      if (err) return res.redirect(req_url);
      if (user) {
        returnedObj['username'] = user.username;
        returnedObj['log'] = user.log.slice(0,limit);
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
