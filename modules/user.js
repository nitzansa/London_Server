var express = require('express');
var user = express();
var DButilsAzure = require('../DButils');
const jwt = require("jsonwebtoken");
var parser = require('body-parser');

user.use(express.json());
module.exports = user;

secret = "londonsecret";

user.use("/private", function(req, res, next){
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

user.post('/register', function(req, res){
    var userName = req.body.user_name;
    var fName = req.body.first_name;
    var lName = req.body.last_name;
    var pass = req.body.password;
    var city = req.body.city;
    var country = req.body.country;
    var email = req.body.email;
    var perferred = req.body.preferredDomains;
    var question1 = req.body.question1;
    var question2 = req.body.question2;
    var ans1 = req.body.ans1;
    var ans2 = req.body.ans2;
    var numbers =/[0-9]/;
    var another =/[@$!%*#?&^+|/~><.'";,=/`]/;
    var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  
    if(!emailReg.test(email)){
        res.send("invalid email");
        return false;
    }
    if(userName.length < 3 || userName.length > 8 || numbers.test(userName) || another.test(userName)){
        res.send("invalid user name");
        return false;
    }
    if(pass.length < 5 || pass.length > 10 || another.test(pass)){
        res.send("invalid password");
        return false;
    }
    var allCategories = perferred.split(','); 
    if(allCategories.length < 2){
        res.send("You must enter at least 2 categories");
        return false;
    }
    for(var i = 0; i < allCategories.length; i++){
        DButilsAzure.execQuery("SELECT name FROM Categories WHERE name = '" + allCategories[i] + "'")
        .then(function(result){
            if(result.length <= 0){
                res.send("invalid category");
                return;   
            }
        })
        .catch(function(err){
            console.log(err)
            res.send(err)
        })    
    }
    DButilsAzure.execQuery("SELECT name FROM Country WHERE name = '" + country + "'")
    .then(function(result){
        if(result.length <= 0){
            res.send("invalid country");
            return;   
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })    
    DButilsAzure.execQuery("SELECT question FROM Questions WHERE question = '" + question1 + "'")
    .then(function(result){
        if(result.length <= 0){
            res.send("invalid first question");
            return;   
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })    
    DButilsAzure.execQuery("SELECT question FROM Questions WHERE question = '" + question2 + "'")
    .then(function(result){
        if(result.length <= 0){
            res.send("invalid second question");
            return;   
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })    
    DButilsAzure.execQuery("SELECT user_name FROM Users WHERE user_name = '" + userName + "'")
    .then(function(result){
        if(result.length > 0){
            res.send("user name is already exsist");
            return;   
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })    

    DButilsAzure.execQuery("INSERT INTO Users (user_name, first_name, last_name, password, city, country, email, preferredDomains, PRQuestion, PRAnswer) VALUES ('" + 
                                userName + "', '" + fName + "', '" + lName + "', '" + pass + "', '" + city + "', '" + country + "', '" 
                                + email + "', '" + perferred + "', '" + (question1 + "," + question2) + "', '" + (ans1 + "," + ans2) + "')")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})


user.post('/login', function(req, res){
    var userName = req.body.user_name;
    var pass = req.body.password;

    DButilsAzure.execQuery("SELECT password FROM Users WHERE user_name = '" + userName + "'")
    .then(function(result){
        if(result.length > 0){
            if(result[0]['password'] === pass){
                payload = { name: userName };
                options = { expiresIn: "1d" };
                const token = jwt.sign(payload, secret, options);
                res.send("{\"token\":" + "\"" + token + "\"" +"}");
            }
            else
                res.send("incorrect details"); ////add to changes!!!!
        }
        else
            res.send("incorrect details"); ////add to changes!!!!
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

user.post('/showQuestion', function(req,res){
    var userName = req.body.user_name;
    
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
    
    DButilsAzure.execQuery("SELECT PRQuestion FROM Users WHERE user_name = '" + userName + "'")
    .then(function(result){
        var q1 = result[0]['PRQuestion'].split(',')[0];
        var q2 = result[0]['PRQuestion'].split(',')[1];
        res.send("{\"question1\":" + "\"" + q1 + "\"" + ",\"question2\":" + "\"" + q2 + "\"" + "}");
    })
    .catch(function(err){
    console.log(err)
    res.send(err)
    })
})

user.post('/restorePassword', function(req,res){
    var userName = req.body.user_name;
    var q = req.body.PRQuestion;
    var ans = req.body.PRAnswer;
    
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

    DButilsAzure.execQuery("SELECT * FROM Users WHERE user_name = '" + userName + "'" )
    .then(function(result){
        var arrayOfQuestion = result[0]['PRQuestion'].split(',')
        var arrayOfAnswers = result[0]['PRAnswer'].split(',')
        var worngQuestion = true;
        for(var i = 0; i < arrayOfQuestion.length; i++){
            if(arrayOfQuestion[i] === q){
                if(arrayOfAnswers[i] === ans){
                    worngQuestion = false;
                    res.send("{\"password\":" + "\"" +  result[0]['password'] + "\"" +  "}")
                }
                else{
                    res.send("your answer is not correct")
                }
            }
                
        }
        if(!worngQuestion)
            res.send("you didn't have this question")
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
});
