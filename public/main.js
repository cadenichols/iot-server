'use strict';

var socket = io();

socket.on('data', function(data) {

  $('.temp').text(data.temp);
  $('.occupant').text(data.occupantDetected);

});
