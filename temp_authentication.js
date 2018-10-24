// TODO :: 20181023. 임시로 passport 처리로직 작성. 이후 로직 재개발 필요
const express = require('express');
var app = express();

var host_ip = process.env.NODE_ENV === 'development' ? 'localhost' : '35.200.103.250';
console.log(host_ip);

// CORS 설정
var cors = require('cors');
app.use(cors());

// passport 설정
var passport = require('passport'),
    KakaoStrategy = require('passport-kakao').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    NaverStrategy = require('passport-naver').Strategy;

// passport-kakao 설정
passport.use(new KakaoStrategy({
    clientID : 'f8c9331888d39bc7d4a20aae640ec817',
    clientSecret: '', // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
    callbackURL : `http://${host_ip}:9070/auth/kakao/callback`
  },
  function(accessToken, refreshToken, profile, done){
    // 사용자의 정보는 profile에 들어있다.
    let userInfo = profile;
    return done(null, profile._json);
  }
));

// passport-facebook 설정
passport.use(new FacebookStrategy({
    clientID: '1831517760493063',
    clientSecret: 'c114f7f7a17050286f8e9a1b05262e4b',
    callbackURL: `http://${host_ip}:9070/auth/facebook/callback`
  },
  function(accessToken, refreshToken, profile, cb) {
    // 사용자의 정보는 profile에 들어있다.
    let userInfo = profile;
    return cb(null, profile._json);
  }
));

// passport-naver 설정
passport.use(new NaverStrategy({
        clientID: 's65ayNOzdLQkAVJyVG09',
        clientSecret: 'qOZX2ptGmT',
        callbackURL: `http://${host_ip}:9070/auth/naver/callback`
    },
    function(accessToken, refreshToken, profile, done) {
      // 사용자의 정보는 profile에 들어있다.
      let userInfo = profile;
      return done(null, profile._json);
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

app.use(passport.initialize());
// kakao 인증처리
app.get('/auth/kakao', passport.authenticate('kakao'));
app.get('/auth/kakao/callback', passport.authenticate('kakao', {
  successRedirect: `http://${host_ip}:8000/code`, // 성공하면 /code으로 가도록
  failureRedirect: `http://${host_ip}:8000/login`
}));

// facebook 인증처리
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: `http://${host_ip}:8000/code`, // 성공하면 /code으로 가도록
  failureRedirect: `http://${host_ip}:8000/login`
}));

// naver 인증처리
app.get('/auth/naver', passport.authenticate('naver'));
app.get('/auth/naver/callback', passport.authenticate('naver', {
  successRedirect: `http://${host_ip}:8000/code`, // 성공하면 /code으로 가도록
  failureRedirect: `http://${host_ip}:8000/login`
}));

app.listen(9070, function () {
  console.log(`authentication server listen host ${host_ip} port 9070`);
});
