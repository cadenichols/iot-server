"use strict";

const PORT = process.env.PORT || 3500;

require('dotenv').load();

var fs = require("fs");
var path = require("path");
var express = require("express");
var http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

server.listen(PORT, function() {
  console.log(`Server listening on port ${PORT}`);
});

app.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, './index.html'));
});

io.on('connection', function(socket){ 
  console.log('device connected');

  socket.on('status', function(status){
    console.log('temp:', status.temp);
    console.log('occupantDetected:', status.occupantDetected);
  });
});
