'use strict';

const conf = require('./conf/config').setting;

const service_ip = conf.service.ip;
const business = require('./modules/monolithic_auth.js');
const cluster = require('cluster'); // cluster 모듈

/**
  Code 클래스
  MicroService Architecture : Code
  developer - ijgong
  date - 20180912
  target git - msa_be_code:develop
*/
class auth extends require('./server.js') {
  constructor () {

    // 초기화
    super('auth',
      process.argv[2] ? Number(process.argv[2]) : 9070,
      ['POST/auth', 'GET/auth/kakao/callback', 'GET/auth/kakao', 'PUT/auth', 'DELETE/auth']
    );

    // Distributor 접속
    this.connectToDistributor(conf.distribute.ip, conf.distribute.port, (data) => {
      console.log("Distributor Notification", data);
    });
  }

  onRead (socket, data) { // onRead 구현
    console.log('onRead', socket.remoteAddress, socket.remotePort, data);
    business.onRequest(socket, data.method, data.uri, data.params, (s, packet) => {
      console.log('microservice_auth.js :: onRead :: packet = ', packet);
      socket.write(JSON.stringify(packet) + '¶');  // 응답 패킷 전송
    });
  }
}

if (cluster.isMaster) { // 부모 프로세스일 경우 자식 프로세스 실행
  cluster.fork();

  // exit 이벤트가 발생하면 새로운 자식 프로세스 실행
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  new auth();  // 인스턴스 생성
}
