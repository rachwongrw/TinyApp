const express = require('express');

const cookieSession = require('cookie-session');

const bcrypt = require('bcrypt');

const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(cookieSession({ keys: ['secret'] }));
app.use(bodyParser.urlencoded({ extended: true }));

const users = {};
const urlDatabase = {};

function urlsForUser(id) {
  const userURLs = {};
  for ( urls in urlDatabase) {
    if (id === urlDatabase[urls].userID) { //   if id matchs id found in urlDatabase
        userURLs[urls] = urlDatabase[urls];  // ...let that object be passed into the userURLs object
    }
  }
  return userURLs;
}

app.get('/', (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get('/urls', (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.send('Woops! 🤷‍♀️ Please sign in');
    return;
  }
  const templateVars = {
    urlDatabase: urlsForUser(req.session.user_id),
    user,
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect('/login');
    return;
  }
  let templateVars = { user };
  res.render('urls_new', templateVars);
});

//  Create Login Page
app.get('/login', (req, res) => {
  let user = users[req.session.user_id];
  const templateVars = { user };
  res.render('login', templateVars);
});

//  Add - New URL
app.post('/urls', (req, res) => {
  let user = users[req.session.user_id];
  let newURLid = generateRandomString(6);
  let newlongURL = req.body.longURL;
  urlDatabase[newURLid] = { shortURL: newURLid, longURL: newlongURL, userID: user.id };
  let templateVars = { user, urlDatabase };
  console.log('Adding object to urlDatabase: ------------ \n', urlDatabase);
  res.redirect('/urls/' + newURLid);
});


app.get('/urls/:id', (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.send('🤷‍♀️ Please sign in');
  // } else if (urlDatabase[req.params.id].shortURL !== req.params.shortURL) { // to check if the ID exists
  //   res.send('Not a valid URL');
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403).send('This link is not yours to view');
  } else {
    const templateVars = {
      longURL: urlDatabase[req.params.id].longURL,
      shortURL: req.params.id,
      user,
    };
    res.render('urls_show', templateVars);
  }
});

//  Short URL redirects to the long URL (actual website)
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (shortURL !== urlDatabase[req.params.shortURL].shortURL) {
    res.status(403).send('short URL does not exist');
  }
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//  Update URL
app.post('/urls/:id', (req, res) => {
  let newLongURL = req.body.newLongURL;
  let shortURL = req.params.id;
  let userCookie = req.session.user_id;
  let userInDB = urlDatabase[shortURL].userID;
  if (userInDB === userCookie) {
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect('/urls');
  } else {
    res.sendStatus(403);
  }
});


//  Add Login and save Cookie
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email && password) { // if email and password are entered, validate user
    var user = validateUser(email, password);
    if (user) {
      req.session.user_id = user.id;
      res.redirect('/urls');
      return;
    } else { // if email and password don't match
      res.status(403).send('Incorrect email and/or password. Otherwise please register');
      return;
    };
  }
});

function validateUser(email, password) { // check user against users database
  for (var id in users) {
    if (users[id].email === email) {
      if (bcrypt.compareSync(password, users[id].password)) {
        return users[id];
        }
    }
  }
}

//  Add Logout
app.post('/logout', (req, res) => {
  req.session = null;
  //   res.clearCookie('user_id');
  res.redirect('/urls');
});

//  Add User Registration
app.get('/register', (req, res) => {
  res.render('register');
});

//  Check if email is taken
function isEmailTaken(email) {
  for (const userId in users) {
    const user = users[userId];
      if (user.email === email) {
        return true;
    }
  }
  return false;
}

//  Create shortURL ID
function generateRandomString(end) {
  return randomString = Math.random().toString(36).substr(2).slice(0, end);
}

app.post('/register', (req, res) => {
  req.session.email = req.body.email;
  req.session.password = req.body.password;

  if (!req.body.email || !req.body.password) {
    return res.status(400).send('Email and Password required');
  }

  if (isEmailTaken(req.body.email)) {
    return res.status(400).send('Email is already taken');
  }

  // Registration
  const newUserID = 'user' + generateRandomString(3);
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: newUserID,
    email: req.body.email,
    password: hashedPassword,
  };

  users[newUserID] = newUser;
  req.session.user_id = newUserID;
  console.log('User Database with new registrar: ', users);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
