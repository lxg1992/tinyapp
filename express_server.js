const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const {grs, urlsForUser, checkSubPresence} = require('./helpers');

const app = express();
const PORT = 8080; 


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['lol'],
  maxAge: 1 * 60 * 60 * 1000 //1hr
}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "user2RandomID"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("pud",10) //Log in form hashes the password, so we have to hash DB passwords too
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk",10)
  },
  "user3RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "abc": {
    id:"abc",
    email:"abc@gmail.com",
    password: bcrypt.hashSync("abc", 10)
  }
};


//Redirects to /urls if logged in and /login if not logged in
app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//FORMAT:  Is this condition true ? Then app executes this process : otherwise app executes that
//Logged in ? Returns index of URLs belonging to current user : sends instructions to login
app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase, user: users[req.session.user_id]};
  if (templateVars.user) {
    templateVars = {urls: urlsForUser(req.session.user_id, urlDatabase), user: users[req.session.user_id]};
    res.render("urls_index", templateVars);
  } else {
    res.send("Please login first <a href='/login'><button>Login</button></a>");
  }
});

// Logged in ? Render a url shortener creation page : redirect to /login
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

// Logged in AND is creator of :shortURL ? Navigate to a details page of the :shortURL : redirect to /logout
app.get("/urls/:shortURL", (req,res) => {
  let urlObj = urlsForUser(req.session.user_id, urlDatabase);
  let params = req.params;
  for (let short in urlObj) {
    if (short === req.params.shortURL) {
      let templateVars =  {
        user: users[req.session.user_id],
        shortURL: params.shortURL,
        longURL: urlDatabase[params.shortURL].longURL
      };
      res.render("urls_show", templateVars);
    }
  }
  res.redirect('/logout');
});

// Logged in && attempting to post ? append data to database and redirect to 
app.post("/urls", (req, res) => {
  if(req.session.user_id === users[req.session.user_id].id) {
    let val = req.body.longURL;
    let key = grs(6); //grs is short for generateRandomString(n) where n is the length of the string returned
    urlDatabase[key] = {longURL: val, userID: req.session.user_id};
    res.redirect(`/urls/${key}`);
  } else {
    res.redirect('/logout');
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.redirect('/logout');
  }  
});

app.post("/urls/:id", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.updatedURL;
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.redirect('/logout');
  }
});

app.get('/login', (req, res) => {
  let templateVars = {
    user: null
  };
  res.render('login', templateVars);
});


app.post("/login", (req, res) => {
  let foundUser = checkSubPresence(users, 'email',req.body.email);
  let foundPW;
  if (foundUser) {
    foundPW = bcrypt.compareSync(req.body.password, users[foundUser].password);
  }  
  if (foundUser && foundPW) {
    req.session.user_id = foundUser;
    console.log(users[foundUser]);
    res.redirect('/urls');
  } else if (foundUser && !foundPW) {
    console.log('Wrong PW');
    res.status(403).send("Wrong password <a href='/login'><button>Back</button></a>");
  } else if (!foundUser) {
    console.log('Cannot find user');
    res.status(403).send("No such user <a href='/register'><button>Register</button></a>");
  }
});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render('register', templateVars);
});


app.post('/register', (req, res) => {
  if (req.body.password === '' || req.body.email === '') {
    res.status(400).send("Empty fields! <a href='/register'><button>Back</button></a>");
  }
  if (checkSubPresence(users, 'email', req.body.email)) {
    res.status(400).send("Already registered <a href='/login'><button>Login</button></a> ");
  }
  let hashedPW = bcrypt.hashSync(req.body.password, 10);
  let rID = grs(3);
  let newUser = {
    id: rID,
    email: req.body.email,
    password: hashedPW
  };  
  users[rID] = newUser;
  req.session.user_id = newUser.id;
  res.redirect('/urls');
});