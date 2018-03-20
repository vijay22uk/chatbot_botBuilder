
var port = process.env.PORT || 3000;
const express = require("express"),
  bodyParser = require("body-parser"),
  path = require("path"),
  fs = require("fs"),
  http = require("http"),
  miniDumpsPath = path.join(__dirname, "public/app-crashes/");
const app = express(),
  server = http.createServer(app);
var jsonParser = bodyParser.json()

app.use(express.static('./public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
  console.log("running on port " + port);
});
