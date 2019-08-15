var express = require('express');
var poi = express();
var DButilsAzure = require('../DButils');
const jwt = require("jsonwebtoken");
var parser = require('body-parser');

poi.use(express.json());
module.exports = poi;

secret = "londonsecret";

poi.use("/private", function(req, res, next){
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

poi.get("/getPOIByCategory/:category",(req,res)=>{ //Add to changes, no private anymore
    //var userName = req.decoded.name;
    var category = req.params.category;
    // DButilsAzure.execQuery("SELECT user_name FROM Users WHERE user_name = '" + userName + "'")
    // .then(function(result){
    //     if(result.length <= 0){
    //         res.send("user is not exist")
    //         return;   
    //     }
    // })
    // .catch(function(err){
    //     console.log(err)
    //     res.send(err)
    // })   
    //DButilsAzure.execQuery("SELECT poi FROM users_fav WHERE CONVERT(VARCHAR, category) = '" + category + "'")
    DButilsAzure.execQuery("SELECT * FROM Point_Of_Interest WHERE category = '" + category + "'")
    .then(function(result){
        if(result.length < 0){
            res.send("Category does not exist")
            return;
        }
        // var toReturn= ""
        // for(var i = 0; i < result.length - 1; i++){
        //     toReturn = toReturn + result[i]['name'] + ",";
        // }
        // toReturn = toReturn + result[i]['name'];
        //res.send("{\"pois\":"  + "\"" + toReturn + "\"" +  "}")
        res.send(result);
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
});

poi.get("/getPOIByName/:name",(req,res)=>{
    var poiName = req.params.name;
    var reviews = "";

    //get the two last reviews
    DButilsAzure.execQuery("SELECT * FROM poi_reviews WHERE poi_name = '" + poiName + "'" + " ORDER BY date ASC")
    .then(function(result){
        if(result.length > 0){
            if(result.length < 2){
                reviews = result[result.length - 1]['review'] + " " + result[result.length - 1]['date'];
            }
            else{
                reviews = result[result.length - 1]['review'] + " " + result[result.length - 1]['date'] + "," 
                            + result[result.length - 2]['review'] + " " + result[result.length - 2]['date'];
            }
        }
        else{
            reviews = "There are no reviews yet";
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })

    //present details
    DButilsAzure.execQuery("SELECT * FROM Point_Of_Interest WHERE name = '" + poiName + "'")
    .then(function(result){
        if(result.length < 0){
            res.send("The point of interest is not stored in data base")
            return;
        }
        var toReturn = "{\"name\":" + "\"" + result[0]['name'] + "\"" + ",\"category\":" + "\"" + result[0]['category'] + "\"" + ",\"views\":" + result[0]['views'] + ",\"description\":" + "\"" + result[0]['description'] + "\"" + ",\"rating\":" 
                    + result[0]['rating'] + ",\"reviews\":" + "\"" + reviews + "\"" +  ",\"image\":" + "\"" + result[0]['picture'] + "\"" + "}";
        res.send(toReturn)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
    //add one view
    DButilsAzure.execQuery("UPDATE Point_Of_Interest SET views = views + 1 WHERE name = '" + poiName + "'")
    .then(function(result){
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
});

poi.get("/private/getRecommendedPOI",(req,res)=>{
    var userName = req.decoded.name;
    DButilsAzure.execQuery("SELECT preferredDomains FROM Users WHERE user_name = '" + userName + "'")
    .then(function(result){
        if(result.length <= 0){
            res.send("user is not exist")
            return;   
        }
        var userCategories = result[0]['preferredDomains'].split(',');
        var toReturn = ""
        DButilsAzure.execQuery("SELECT name FROM Point_Of_Interest WHERE category = '" + userCategories[0] + "' ORDER BY rating DESC")
        .then(function(result){
            toReturn = result[0]['name'];
        })
        .catch(function(err){
            console.log(err)
            res.send(err)
        })    
        DButilsAzure.execQuery("SELECT name FROM Point_Of_Interest WHERE category = '" + userCategories[1] + "' ORDER BY rating DESC")
        .then(function(result){
            toReturn = toReturn + "," + result[0]['name'];
            res.send("{\"pois\":" + "\"" + toReturn + "\"" + "}")
        })
        .catch(function(err){
            console.log(err)
            res.send(err)
        })    
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
});

poi.get("/getRandomPOI", (req, res) => {
    var rank = 70;
    //res.header("Access-Control-Allow-Origin", "*");
    DButilsAzure.execQuery("SELECT name FROM Point_Of_Interest WHERE rating >= '" + rank + "'")
    .then(function(result){
        if(result.length<3){
            var toReturn = "";
            for(var i = 0 ; i < result.length - 1 ; i++){
                toReturn = toReturn + result[i]['name'] + " , ";
            }
            toReturn = toReturn + result[i]['name'];
            res.send(toReturn);
        }
        var rand = Math.floor(Math.random() * result.length);
        var rand2 = Math.floor(Math.random() * result.length);
        while(rand2 === rand){
            rand2 = Math.floor(Math.random() * result.length);
        }
        var rand3 = Math.floor(Math.random() * result.length) ;
        while(rand3 === rand || rand3 === rand2){
            rand3 = Math.floor(Math.random() * result.length);
        }
        res.send("{\"poi1\":" + "\"" + result[rand]['name'] + "\"" + ",\"poi2\":" + "\"" + result[rand2]['name'] + "\"" + ",\"poi3\":" + "\"" + result[rand3]['name'] + "\"" + "}")
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
});

poi.post('/private/postReview', async function(req, res){
    var userName = req.decoded.name;
    var poiName = req.body.poi_name;
    var review = req.body.review;
    var rating = req.body.rating;
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
    DButilsAzure.execQuery("SELECT name FROM Point_Of_Interest WHERE name = '" + poiName + "'")
    .then(function(result){
        if(result.length < 0){
            res.send("The point of interest is not stored in data base")
            return;
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
    DButilsAzure.execQuery("INSERT INTO poi_reviews (user_name, poi_name, review, rating, date) VALUES('" + userName + "', '" +
                                poiName + "', '" + review + "', '" + rating + "', '" + today + "')")
    .then(function(result){
        DButilsAzure.execQuery("UPDATE Point_Of_Interest SET rating = (SELECT AVG(rating)/5*100 FROM poi_reviews WHERE poi_name =  '" + poiName + "') WHERE name = '" + poiName + "'")
        .then(function(result){
            res.send(result)
        })
        .catch(function(err){
            console.log(err)
            res.send(err)
        })
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
    
})