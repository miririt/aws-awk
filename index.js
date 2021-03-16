const settings = require('./settings');
const Worker = require('./worker');

const express = require('express');
const bodyParser = require('body-parser');

const server = express();

Worker.initialize();

server.listen(settings.server.port, function() {
  console.log(`App is listening at ${settings.server.port}`);
});

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use('/', Worker.getRouter());
server.use(express.static('public'));