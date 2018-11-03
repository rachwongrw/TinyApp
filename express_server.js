var express = require("express");
var app = express();
var PORT = 8080;
var cookieParser = require('cookie-parser')

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

//User Database
const users = { 
    "userRandomID": {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "asdf"
    },
   "user2RandomID": {
      id: "user2RandomID", 
      email: "user2@example.com", 
      password: "qwerty"
    }
}  

console.log('Users database: ---------------\n', users)

//URL database
var urlDatabase = {
    "b2xVn2": {
        shortURL: "b2xVn2",
        longURL: "http://www.lighthouselabs.ca",
        userID: users['userRandomID'].id
    },
    "9sm5xK": { //shortURL is also the key to access this object!!
        shortURL: "9sm5xK", //i.e. urlDatabase[shortURL].shortURL
        longURL: "http://www.google.com", // i.e. urlDatabase[shortURL].longURL
        userID: users['user2RandomID'].id
    }
}
console.log('URL database: ----------------- \n', urlDatabase); 

function urlsForUser(id) { //id is the req.cookies['user_id'] as we've implemented in the function
    let userURLs = {}; //templateVars is an object so we want to keep this variable an object too or we have to change other vars 
    for (var urls in urlDatabase) { // for each key in the urlDatabase
        if (id === urlDatabase[urls].userID) { //if id matchs id found in urlDatabase
            userURLs[urls] = urlDatabase[urls];  //... let that object be passed into the userURLs object
        }
    }
    return userURLs; 
}

app.get("/urls", (req, res) => {
    let user = users[req.cookies['user_id']];  
    if (!user) {
        res.send("Woops! 🤷‍♀️ Please sign in");
        return;
    }
    let templateVars = {
        urlDatabase: urlsForUser(req.cookies['user_id']),
        user
    };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let user = users[req.cookies['user_id']];
    if (!user) {
        res.redirect('/login');
        return;
    }
    let templateVars = { user };
    res.render("urls_new", templateVars);
});

//Create Login Page
app.get("/login", (req, res) => {
    let user = users[req.cookies['user_id']]; 
    let templateVars = { user };
    res.render("login", templateVars);
})

//Add - New URL 
app.post("/urls", (req, res) => {
    let user = users[req.cookies['user_id']]; 
    let newURLid = generateRandomString(6);
    let newlongURL = req.body.longURL;
    urlDatabase[newURLid] = {shortURL: newURLid, longURL: newlongURL, userID: user.id };
    let templateVars = { user, urlDatabase };
    console.log('Adding object to urlDatabase: ------------ \n', urlDatabase);
    res.redirect('/urls/' + newURLid);
});


app.get("/urls/:id", (req, res) => {
    let user = users[req.cookies['user_id']]; 
    if (!user) {
        res.send("🤷‍♀️ Please sign in");
        return;
    }
    let templateVars = { 
        longURL: urlDatabase[req.params.id].longURL, 
        shortURL: req.params.id,  
        user
    };
    res.render("urls_show", templateVars);
});

//Short URL redirects to the long URL (actual website) 
app.get("/u/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL;
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.post("/urls/:id/delete", (req, res) => {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
});

//Update URL 
app.post("/urls/:id", (req, res) => {
    let newLongURL = req.body.newLongURL;
    let shortURL = req.params.id;
    let userCookie = req.cookies['user_id'];
    let userInDB = urlDatabase[shortURL].userID;

    if (userInDB === userCookie) {
        urlDatabase[shortURL].longURL = newLongURL;
        res.redirect('/urls/' + shortURL) ;
        return;
    } else {
        res.sendStatus(403);
    }
});


//Add Login and save Cookie
app.post("/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    if (email && password) { // if email and password are entered, validate user
        var user = validateUser(email, password);
        if (user) {
            res.cookie('user_id', user.id);
            res.redirect('/urls');
            return;
        } else { //if email and password don't match
            res.status(403).send("Incorrect email and/or password");
            return;
        };
    }
});

function validateUser(email, password) { //check user against users database
    for (var id in users) {
        if (users[id].email === email && users[id].password === password) {
            return users[id];
        }
    }
}

//Add Logout
app.post("/logout", (req, res) => {
    res.clearCookie('user_id');
    res.redirect('/login');
});

//Add User Registration
app.get("/register", (req, res) => {
    res.render("register");
  });

app.post("/register", (req, res) => {
    res.cookie('email', req.body.email);
    res.cookie('password', req.body.password);

    // see if email and passwords are empty strings 
    if (!req.body.email || !req.body.password) {
        return res.status(400).send("Email and Password required");

    }
    // call the isEmailTaken function
    if (isEmailTaken(req.body.email)) {
        return res.status(400).send("Email is already taken");
    };
    // Registration 
    let newUserID = 'user' + generateRandomString(3);
    let newUser = {
        id: newUserID,
        email: req.body.email,
        password: req.body.password,
    }
    users[newUserID] = newUser;
    res.cookie('user_id', newUserID); //setting user_id to newUserID
    console.log('User Database', users);
    res.redirect("/urls");
});


app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

//Create shortURL ID
function generateRandomString(end) {
    return randomString = Math.random().toString(36).substr(2).slice(0, end);
}

//Check if email is taken
function isEmailTaken(email){
    for(const userId in users){
        const user = users[userId];
        if(user.email === email){
            return true;
        }
    }
    return false;
}