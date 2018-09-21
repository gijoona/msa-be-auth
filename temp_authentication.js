const express = require('express');
var app = express();

// CORS 설정
var cors = require('cors');
app.use(cors());

// passport 설정
var passport = require('passport'),
    KakaoStrategy = require('passport-kakao').Strategy;

// passport-kakao 설정
passport.use(new KakaoStrategy({
    clientID : 'f8c9331888d39bc7d4a20aae640ec817',
    clientSecret: '', // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
    callbackURL : 'http://localhost:9070/auth/kakao/callback'
  },
  function(accessToken, refreshToken, profile, done){
    // 사용자의 정보는 profile에 들어있다.
    console.log('profile', profile._json);
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
app.get('/auth/kakao', passport.authenticate('kakao'));
app.get('/auth/kakao/callback', passport.authenticate('kakao', {
  successRedirect: 'http://localhost:8080/code', // 성공하면 /code으로 가도록
  failureRedirect: 'http://localhost:8080/login'
}));

app.listen(9070, function () {
  console.log('authentication server listen port 9070');
});
