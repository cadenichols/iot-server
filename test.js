var base64 = require('base-64');
var request = require('request');
var async = require('async');
require('dotenv').load();
var str = `${process.env.PB_API_KEY}:${process.env.PB_SECRET}`;

var key = base64.encode(str);


var lat = 37.4047,
    lng = -121.9752;

getPBData(lat, lng, function(err, data) {
  console.log(err);
  console.log(data);
})

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

