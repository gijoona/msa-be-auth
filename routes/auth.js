const mongoose = require('mongoose'),
      passport = require('passport'),
      settings = require('../conf/settings')
      conf = require('../conf/config').setting,
      express = require('express'),
      jwt = require('jsonwebtoken'),
      router = express.Router(),
      User = require('../models/user');

require('../conf/passport')(passport);

const redis = require('redis').createClient(conf.redis.port, conf.redis.ip);   // redis 모듈 로드
redis.on('error', function (err) {  // Redis 에러 처리
  console.log('Redis Error ' + err);
});

// user 등록
router.post('/register', function (req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Plase pass username and password.'});
  } else {
    let newUser = new User({
      id: req.body.username,
      password: req.body.password
    });
    // save the user
    newUser.save(function (err, user) {
      if (err) return res.json({success: false, msg: 'Username already exists.'});
      // res.json({success: true, msg: 'Successfull created new user.'});

      let token = jwt.sign(user.toJSON(), settings.secret);
      let resultJSON = { success: true, token: 'JWT ' + token }

      // user --> redis
      redis.set(token, user.toJSON());
      res.json(resultJSON);
    });
  }
});

// user login
router.post('/login', function (req, res) {
  User.findOne({
    id: req.body.username
  }, function (err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matchs
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          let token = jwt.sign(user.toJSON(), settings.secret);
          // TODO :: JWT는 어떤처리를 하는걸까?
          let resultJSON = { success: true, token: 'JWT ' + token }
          // user --> redis
          redis.set(token, user.toJSON());
          res.json(resultJSON);
        } else {
          res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

module.exports = router;
