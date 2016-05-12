"use strict";

const PORT = process.env.PORT || 3500;

require('dotenv').load();

var fs = require("fs");
var path = require("path");
var express = require("express");
var http = require('http');
var morgan = require('morgan');

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

// var tropo = require('simple-tropo')({
//   token : process.env.TROPO_TOKEN
// }).listen(app)


app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, './public')));

server.listen(PORT, function() {
  console.log(`Server listening on port ${PORT}`);
});

app.post('/text', (req, res) => {

  console.log('req.body:', req.body);

  res.send();


})


// tropo.listener = function(res,tropo_obj){
//   console.log('res:', res);
//   console.log('tropo_obj:', tropo_obj);
// };


var alertInterval, temp, occupantDetected;
var tempArray = [];

alertInterval = setInterval(function(){
  if(temp >= 21 && occupantDetected) {
    console.log('ALERT!');
    // alertMessage(process.env.PHONE_NUMBER, messages[counter]);
  }
}, 10000);


io.on('connection', function(socket) {
  console.log('device connected');
  
  socket.on('status', function(status) {
    temp = status.temp;
    occupantDetected = status.occupantDetected;
    io.emit('data', status);
  });

});


// var firstMessage = 'Occupant detected\n' +
//     'Current car temperature: ' + temp + \n +
//     'Please check vehicle and reply "OK"';
// var secondMessage = 'Current car temperature: ' + temp + \n +
//     'Please check vehicle and reply "OK"' + \n +
//     'or emergency services will be contacted';
// var thirdMessage = 'Car temperature critical: ' + temp + \n +
//     'Emergency services will be contacted' + \n +
//     'in 1 minute, reply "OK" to cancel';

// var messages = [firstMessage, secondMessage, thirdMessage];
// var counter = 0;

// function alertMessage = (phoneNum, message) {
//     http.get('https://api.tropo.com/v1/sessions?action=create&token=${process.env.TROPO_TOKEN}&msg=${message}&numberToSMS=${phoneNum}',
//         function(err, res) {
//             if (!err && res.statusCode === 200) {
//                 console.log('success');
//                 return 'success';
//             }
//         })
// }
