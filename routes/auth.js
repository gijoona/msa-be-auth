const mongoose = require('mongoose'),
      passport = require('passport'),
      settings = require('../conf/settings')
      conf = require('../conf/config').setting,
      express = require('express'),
      jwt = require('jsonwebtoken'),
      router = express.Router(),
      User = require('../models/User');

require('../conf/passport')(passport);

// redis 설정
const redis = require('redis').createClient(conf.redis.port, conf.redis.ip);   // redis 모듈 로드
redis.on('error', function (err) {  // Redis 에러 처리
  console.log('Redis Error ' + err);
});

// user 등록
router.post('/register', function (req, res) {
  if (!req.body.username || !req.body.password || !req.body.displayName) {
    res.json({success: false, msg: 'Plase pass username and password, Nickname.'});
  } else {
    let newUser = new User({
      id: req.body.username,
      password: req.body.password,
      displayName: req.body.displayName
    });
    // save the user
    newUser.save(function (err, user) {
      if (err) return res.json({success: false, msg: 'Username already exists.'});
      // res.json({success: true, msg: 'Successfull created new user.'});
      /*
        현재 구조(사용자정보에 수령퀘스트를 subDoc으로 추가하는 방식)에서
        이대로 처리할 경우 퀘스트를 수령할때마다 jwt가 길어지게 되므로 header로 전송 시 문제가 발생
        user정보에서 _id만을 이용해서 jwt를 생성하도록 수정.
        - 사용자정보를 역산하지 않기 때문에 가능
      */
      let simpleUser = {
        _id: user['_id'],
        id: user.id,
        password: user.password
      };
      let token = jwt.sign(simpleUser, settings.secret);
      let resultJSON = { success: true, token: 'JWT ' + token }

      // user --> redis
      redis.set(resultJSON.token, JSON.stringify(user));
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
          /*
            현재 구조(사용자정보에 수령퀘스트를 subDoc으로 추가하는 방식)에서
            이대로 처리할 경우 퀘스트를 수령할때마다 jwt가 길어지게 되므로 header로 전송 시 문제가 발생
            user정보에서 필수 정보만을 이용해서 jwt를 생성하도록 수정.
            - 사용자정보를 역산하지 않기 때문에 가능
          */
          let simpleUser = {
            _id: user['_id'],
            id: user.id,
            password: user.password
          };
          let token = jwt.sign(simpleUser, settings.secret);
          // let token = jwt.sign(user.toJSON(), settings.secret);
          // TODO :: JWT는 어떤처리를 하는걸까?
          let resultJSON = { success: true, token: 'JWT ' + token }

          // user --> redis
          redis.set(resultJSON.token, JSON.stringify(user));
          res.json(resultJSON);
        } else {
          res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

// user logout
router.post('/logout', function (req, res) {
  let response = {
    errorcode: 0,
    errormessage: 'success'
  };

  let authorization = req.headers.authorization;
  redis.del(authorization);
  res.json(response);
});

module.exports = router;
