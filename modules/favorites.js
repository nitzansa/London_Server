var express = require('express');
var favorites = express();
var DButilsAzure = require('../DButils');
const jwt = require("jsonwebtoken");
var parser = require('body-parser');

favorites.use(express.json());
module.exports = favorites;

secret = "londonsecret";

favorites.use("/private", function(req, res, next){
    const token = req.header("x-auth-token");
	// no token
	if (!token) res.status(401).send("Access denied. No token provided.");
	// verify token
	try {
		const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
		next(); //move on to the actual function
	} catch (exception) {
		res.status(400).send("Invalid token.");
	}
});

favorites.get("/private/getSavedPOI",(req,res)=>{
    var userName = req.decoded.name;
    var toSend = "";
    var toSendOrder = "";
    DButilsAzure.execQuery("SELECT * FROM users_fav WHERE user_name = '" + userName + "' ORDER BY order_fav ASC")
    .then(function(result){
        if(result.length > 0){
            toSend = result[0]['poi'];
            toSendOrder = result[0]['order_fav'];
            for(var i = 1; i < result.length; i++){
                toSend = toSend + "," + result[i]['poi'];
                toSendOrder = toSendOrder + "," + result[i]['order_fav'];
           } 
           res.send("{\"pois\":" + "\"" + toSend + "\"" + "," + "\"orders\":" + "\"" + toSendOrder + "\"" + "}")
        }
        else{
            res.send("There are no points of interest reserved for this user")
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
});
favorites.get("/private/getLastPOI",(req,res)=>{
    var userName = req.decoded.name;
    DButilsAzure.execQuery("SELECT * FROM users_fav WHERE user_name = '" + userName + "'" + " ORDER BY date ASC")
    .then(function(result){
        var toSend = "";
        if(result.length > 0){
            if(result.length < 2){
                toSend = toSend + result[result.length - 1]['poi'];
            }
            else{
                toSend = toSend + result[result.length - 2]['poi'] + "," + result[result.length - 1]['poi'];
            }
        }
        else{
            res.send("user didn't saved any point of interest")
        }
        res.send("{\"pois\":" + "\"" + toSend + "\"" +  "}")
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
});

favorites.post('/private/addToFavList', async function(req, res){
    var userName = req.decoded.name;
    var poisName = req.body.poi.split(',');
    var size = 0;
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10) {
        dd = '0'+dd
    } 
    if(mm<10) {
        mm = '0'+mm
    } 
    today = mm + '/' + dd + '/' + yyyy;
    DButilsAzure.execQuery("SELECT user_name FROM Users WHERE user_name = '" + userName + "'")
    .then(function(result){
        if(result.length <= 0){
            res.send("user is not exist")
            return;   
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })   
    var result;
    try{
        result = await DButilsAzure.execQuery("SELECT user_name FROM users_fav WHERE user_name = '" + userName + "'"); 
    }
    catch(e){
        console.log(e);
    }

    var size = result.length;
    for(var i = 0; i < poisName.length; i++){
        // DButilsAzure.execQuery("SELECT name FROM Point_Of_Interest WHERE name = '" + poisName[i] + "'")
        // .then(function(result){
        //     if(result.length > 0){
        //         console.log(poisName[i]);
                DButilsAzure.execQuery("INSERT INTO users_fav (user_name, poi, date,order_fav) VALUES('" + userName + "', '" + poisName[i] + "', '" + today + "', '"+ size + "')")
                .then(function(result){
                    res.send(result)
                })
                .catch(function(err){
                    console.log(err)
                    res.send(err)
                })
                size++;
           // }
        //     else
        //         res.send("The point of interest is not stored in data base")
        // })
        // .catch(function(err){
        //     console.log(err)
        //     res.send(err)
        // })
    }
   
})

favorites.delete('/private/deletePOIOfUser', function(req, res){
    var userName = req.decoded.name;
    var poiName = req.body.poi;

    DButilsAzure.execQuery("SELECT user_name FROM Users WHERE user_name = '" + userName + "'")
    .then(function(result){
        if(result.length <= 0){
            res.send("user is not exist")
            return;   
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })   

    DButilsAzure.execQuery("SELECT user_name FROM users_fav WHERE user_name = '" + userName + "' AND poi = '" + poiName + "'")
    .then(function(result){
        if(result.length <= 0){
            res.send("The point of interest is no reserved for this user")
            return;   
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
    
    DButilsAzure.execQuery("DELETE FROM users_fav WHERE user_name = '" + userName + "' AND poi = '" + poiName + "'")
    .then(function(result){
        res.send("Point of interest deleted")
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})