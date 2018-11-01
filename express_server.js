var express = require("express");
var app = express();
var PORT = 8080;
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"   
};
app.get("/", (req, res) => {
    res.send("Hello!");
});

app.get("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
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
    let templateVars = { longURL: urlDatabase[req.params.id], shortURL: req.params.id };
    res.render("urls_show", templateVars);
});

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
    res.cookie('username', req.body.username);
    res.redirect('/urls');
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
  });

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString(end) {
    return randomString = Math.random().toString(36).substr(2).slice(0, end);
}