// TODO :: 20181023. 임시로 passport 처리로직 작성. 이후 로직 재개발 필요
const express = require('express');
var app = express();
app.use(express.json());  // POST request 처리

var host_ip = process.env.NODE_ENV === 'development' ? 'localhost' : '35.200.103.250';
console.log(host_ip);

// CORS 설정
var cors = require('cors');
app.use(cors());

// MongoDB 설정
const MongoClient = require('mongodb').MongoClient;
// const mongoUri = 'mongodb+srv://gijoona:mongodb77@cluster-quester-euzkr.gcp.mongodb.net/test?authSource=test&w=1';
const mongoUri = 'mongodb+srv://gijoona:mongodb77@cluster-quester-euzkr.gcp.mongodb.net/test';

// passport 설정
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    KakaoStrategy = require('passport-kakao').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    NaverStrategy = require('passport-naver').Strategy;

/*
custom profile {
	provider: ['kakao', 'facebook', 'naver'],
	id: '',
	displayName: '',
	username: '',
	emails: [],
	name: {familyName: '', givenName: '', middleName: ''}
	gender: '',
	profileUrl: '',
	_json: {
		id: '',
		uuid: '',
		nickname: '',
		profile_image: '',
		thumbnail_image: '',
		email: '',
		age: '',
		birthday: '',
	}
}
*/
// passport-local 설정
passport.use(new LocalStrategy(function(username, password, done){
  let profile = {};
  console.log(username, password);
  MongoClient.connect(mongoUri, function(err, client) {
     if(err) {
          console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
     }
     console.log('Connected...');
     let collection = client.db('test').collection('devices');

     collection.find({id: username, password: password, provider: 'local'}).toArray(function(err, results){
       if(err) throw err;
       if (results.length == 0) {
         return done(null, false);
       } else {
         return done(null, results);
       }
       client.close();
     });
  });
}));
// passport-kakao 설정
passport.use(new KakaoStrategy({
    clientID : 'f8c9331888d39bc7d4a20aae640ec817',
    clientSecret: '', // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
    callbackURL : `http://${host_ip}:9070/auth/kakao/callback`
  },
  function(accessToken, refreshToken, profile, done){
    // 사용자의 정보는 profile에 들어있다.
    // _json.properties에 들어있는 데이터를 _json으로 한단계 올린다.
    Object.assign(profile._json, profile._json.properties);
    save(profile);
    return done(null, profile);
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
    save(profile);
    return cb(null, profile);
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
      save(profile);
      return done(null, profile);
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

app.use(passport.initialize());
// 회원가입
app.get('/auth/join', function(req, res){
  res.send('join');
});

// local 인증처리
app.post('/auth/local', passport.authenticate('local', { failureRedirect: `http://${host_ip}:8080/login` }), function(req, res) {
  res.redirect(`http://${host_ip}:8080/main`);
});

// kakao 인증처리
app.get('/auth/kakao', passport.authenticate('kakao'));
app.get('/auth/kakao/callback', passport.authenticate('kakao', {
  successRedirect: `http://${host_ip}:8080/main`, // 성공하면 /code으로 가도록
  failureRedirect: `http://${host_ip}:8080/login`
}));

// facebook 인증처리
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: `http://${host_ip}:8080/main`, // 성공하면 /code으로 가도록
  failureRedirect: `http://${host_ip}:8080/login`
}));

// naver 인증처리
app.get('/auth/naver', passport.authenticate('naver'));
app.get('/auth/naver/callback', passport.authenticate('naver', {
  successRedirect: `http://${host_ip}:8080/main`, // 성공하면 /code으로 가도록
  failureRedirect: `http://${host_ip}:8080/login`
}));

app.listen(9070, function () {
  console.log(`authentication server listen host ${host_ip} port 9070`);
});

function save (profile) {
  MongoClient.connect(mongoUri, function(err, client) {
     if(err) {
          console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
     }
     console.log('Connected...');
     let collection = client.db('test').collection('devices');
     // const collection = client.db("test").collection("devices").insertOne(profile);
     collection.find({id: profile.id, provider: profile.provider}).toArray(function(err, results){
       if(err) throw err;
       if (results.length == 0) {
         collection.insertOne(profile);
       }
       client.close();
     });
  });
}
