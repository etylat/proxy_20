var util = require('util'),
    colors = require('colors'),
    http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy');

var host = 'localhost:8002/';
var selects = [];
var simpleselect = {};

simpleselect.query = '*[src]';
simpleselect.func = function (node) {
  var srctmp = node.getAttribute('src');
  srctmp = srctmp.replace('://', '://' + host);
  node.setAttribute('src', srctmp);
}

selects.push(simpleselect);

simpleselect.query = '*[href]';
simpleselect.func = function (node) {
  var srctmp = node.getAttribute('href');
  srctmp = srctmp.replace('://', '://' + host);
  node.setAttribute('href', srctmp);
}

selects.push(simpleselect);

var app = connect();

//
// Http Server with proxyRequest Handler and Latency
//
var proxy = new httpProxy.createProxyServer();

app.use(require('harmon')([], selects));

app.use(function (req, res) {
  delete req.headers.host;
  var url = req.url;
  req.url = '';
  delete res.headers['content-length'];
  proxy.web(req, res, { target: 'http:/' + url });
});

http.createServer(app).listen(80);




proxy.on('error', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  
  res.end('Something went wrong. And we are reporting a custom error message.');
});

//
// Target Http Server
//
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('request successfully proxied to: ' + req.url + '\n' + JSON.stringify(req.headers, true, 2));
  res.end();
}).listen(9002);

util.puts('http server '.blue + 'started '.green.bold + 'on port '.blue + '8002 '.yellow + 'with proxy.web() handler'.cyan.underline + ' and latency'.magenta);
util.puts('http server '.blue + 'started '.green.bold + 'on port '.blue + '9001 '.yellow);
