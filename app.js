var http = require('http');
var zlib = require('zlib');

var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://postgres:root@localhost:5432/postgres');
/**
var sequelize = new Sequelize('postgres', 'postgres', 'root', {
  dialect: 'postgres' //mariadb, SQLite, Postgresql, mssql
});
**/


//DATABASE
var Request = sequelize.define('request',{
  path: Sequelize.STRING,
  method: Sequelize.STRING,
  headers: Sequelize.STRING,
  res_code: Sequelize.STRING,
  res_body: Sequelize.STRING,
  hash: Sequelize.STRING
});






http.createServer(onRequest).listen(3000);
console.log("start server");

function onRequest(client_req, client_res) {
  console.log('serve: ' + client_req.url);

  var options = {
    hostname: 'api.jikan.moe',
    port: 80,
    path: client_req.url,
    method: client_req.method,
    headers: client_req.headers
  };

  var proxy = http.request(options, function (res) {
    client_res.writeHead(res.statusCode, res.headers);

    //TODO encode data
    var stream;
    if(res.headers['content-encoding'] === "gzip"){
      console.log('gzip');
      stream= zlib.createGunzip();
      res.pipe(stream);
    } else {
      stream = res;
    }

    var body = '';

    stream.on('data', function (chunk) {
      body += chunk.toString();
    });

    stream.on('end', function (chunk) {
      console.log('BODY: ' + body);
      //TODO save body

      hash = '#hash';//createHash();

      sequelize.sync().then(function() {
        return  Request.create({
          path: options.path,
          method: options.method,
          headers: options.headers,
          res_code: res.statusCode,
          res_body: body,
          hash: hash
        });
      });



    });



    res.pipe(client_res, {
      end: true
    });
  });

  client_req.pipe(proxy, {
    end: true
  });

}