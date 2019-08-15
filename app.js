var express = require('express');
var app = express();
var cors = require('cors');
var DButilsAzure = require('./DButils');
var user = require('./modules/user');
var poi = require('./modules/poi');
var favorites = require('./modules/favorites');
const jwt = require("jsonwebtoken");

app.use(cors());
app.use('/user', user);
app.use('/poi', poi);
app.use('/favorites', favorites);
var port = 3000;
app.use(express.json());

app.use(express.json(),function(req, res, next) {
	express.json();
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    // if (req.method === 'OPTIONS') {
    //     res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    //     return res.status(200).json({});
    // }
    next();
});

app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

secret = "londonsecret";









