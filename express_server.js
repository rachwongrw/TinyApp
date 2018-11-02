var express = require("express");
var app = express();
var PORT = 8080;
var cookieParser = require('cookie-parser')

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

//URL database
var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"   
};


//User Database
const users = { 
    "userRandomID": {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    },
   "user2RandomID": {
      id: "user2RandomID", 
      email: "user2@example.com", 
      password: "dishwasher-funk"
    }
}   


app.get("/urls", (req, res) => {
    let user = users[req.cookies['user_id']];
    console.log("UserID: ", req.cookies.user_id, "USER: ", user);
    let templateVars = {
        urls: urlDatabase,
        username: req.cookies['username'],
        user
    };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = { username: req.cookies['username'], users };
    res.render("urls_new", templateVars);
})

//Add - New URL 
app.post("/urls", (req, res) => {
    let newURLid = generateRandomString(6);
    let newlongURL = req.body.longURL;
    urlDatabase[newURLid] = newlongURL;
    // console.log(urlDatabase);
    res.redirect('/urls/' + newURLid);
});

app.get("/urls/:id", (req, res) => {
    let templateVars = { longURL: urlDatabase[req.params.id], shortURL: req.params.id, username: req.cookies['username'], users };
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
    let shortURL = req.params.id;
    let newLongURL = req.body.newLongURL;
    urlDatabase[shortURL] = newLongURL;
    console.log("Database: " + JSON.stringify(urlDatabase));
    res.redirect('/urls');
});

//Add Login and save Cookie
app.post("/login", (req, res) => {
    let templateVars = { username: req.cookies['username'] };
    res.cookie('username', req.body.username);
    res.redirect('/urls');
});

//Add logout
app.post("/logout", (req, res) => {
    let templateVars = { username: req.cookies['username'] };
    res.clearCookie('username');
    res.redirect('/urls');
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
    res.cookie('user_id', newUserID); 
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