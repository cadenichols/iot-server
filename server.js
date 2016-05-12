"use strict";

const PORT = process.env.PORT || 3500;

require('dotenv').load();

var fs = require("fs");
var path = require("path");
var express = require("express");
var http = require('http');
var morgan = require('morgan');
var bodyParser = require('body-parser')
var request = require('request');
var base64 = require('base-64');

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

app.use(morgan('dev'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, './public')));

server.listen(PORT, function() {
  console.log(`Server listening on port ${PORT}`);
});

app.post('/text', (req, res) => {

  var text = req.body.session.initialText.toLowerCase().trim();

  if(text === 'ok') {
    clearInterval(alertInterval);    
  }

  res.send();
})

var checkInterval, temp, occupantDetected, alertInterval;
var tempArray = [];

var handlingAlert = false;

checkInterval = setInterval(function(){
  if(temp >= 20 && occupantDetected && !handlingAlert) {
    handlingAlert = true;
    triggerAlert()
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


function triggerAlert() {
  var firstMessage = 'Occupant detected\n' +
      'Current car temperature: ' + temp + '\n' +
      'Please check vehicle and reply "OK"';
  var secondMessage = 'Current car temperature: ' + temp + '\n' +
      'Please check vehicle and reply "OK"' + '\n' +
      'or emergency services will be contacted';
  var thirdMessage = 'Car temperature critical: ' + temp + '\n' +
      'Emergency services will be contacted' + '\n' +
      'in 1 minute, reply "OK" to cancel';

  var messages = [firstMessage, secondMessage, thirdMessage];
  var counter = 0;
  var lat = 37.4047,
      lng = -121.9752;

  alertInterval = setInterval(function() {
    alertMessage(process.env.PHONE_NUMBER, messages[counter], function(err, res) {
      if(!err && res.statusCode === 200) {
        console.log('success');
      }
    });

    counter++;
    
    if(counter === 2) {
      clearInterval(alertInterval);
      getPBData(lat, lng, (err, data) => {
        var message = `There is an emergency. Occupant in very hot vehicle.\nLocation: ${data.streetAddress}, ${data.locationAddress}`;

        alertMessage(process.env.EMERGENCY_NUMBER, message, function(err, res) {
          if(!err && res.statusCode === 200) {
            console.log('success');
          }
        });

      });
    }
  }, 15 * 1000);
}



function alertMessage = (phoneNum, message, cb) {
  var apiUrl = 'https://api.tropo.com/v1/sessions?action=create&token=${process.env.TROPO_TOKEN}&msg=${message}&numberToSMS=${phoneNum}';
  http.get(apiUrl,cb);
}


function getPBData(lat, lng, cb) {
  var key = base64.encode(`${process.env.PB_API_KEY}:${process.env.PB_SECRET}`);

  request({
    url: 'https://api.pitneybowes.com/oauth/token',
    method: "POST",
    headers: {
      Authorization: 'Basic ' + key
      // 'Content-type': 'application/x-www-form-urlencoded'
    },
    form: {
      grant_type: 'client_credentials'
    }
  }, (err, res, token) => {
    console.log('token received:', JSON.parse(token).access_token);
    token = JSON.parse(token).access_token;

    async.parallel([
      function(callback){
        request.get({
          url: 'https://api.pitneybowes.com/location-intelligence/geo911/v1/psap/bylocation?latitude=' + lat + '&longitude=' + lng,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }, function(err, res, body) {

          callback(null, JSON.parse(body));

        })
      },
      function(callback) {
        request.get({
          url: 'https://api.pitneybowes.com/location-intelligence/geocode-service/b1/transient/premium/reverseGeocode?y=' + lat + '&x=' + lng + '&coordSysName=EPSG:4326&distance=1500&distanceUnits=METERS',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }, function(err, res, body) {
          body = JSON.parse(body);

          callback(null, body.candidates[0]);

        })
      }
    ], function(err, results){
      var geoData = {
        phone: results[0].phone,
        streetAddress: results[1].formattedStreetAddress,
        locationAddress: results[1].formattedLocationAddress
      }
      cb(err, geoData);
    });

  });

}

