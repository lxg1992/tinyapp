const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

//server command: ./node_modules/.bin/nodemon -L express_server.js 

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase, user: users[req.cookies["user_id"]],
};
  res.render("urls_index", templateVars);
});

app.get("/hello", function(req,res) {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req,res) => {
  let templateVars =  {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);

});

app.post("/urls", (req, res) => {
  
  console.log(req.body);
  let val = req.body.longURL;
  let key = grs(6);
  urlDatabase[key] = val;
  res.redirect(`/urls/${key}`);
  console.log(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
})

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.updatedURL;
  console.log(urlDatabase);

  res.redirect(`/urls/${req.params.id}`);
})

app.get('/login', (req, res) => {
  let templateVars = {
    user: null
  }
  res.render('login', templateVars);
})


app.post("/login", (req, res) => {
  let foundUser = checkSubPresence(users, 'email',req.body.email)
  let foundPW = checkSubPresence(users, 'password', req.body.password);
  
  //res.cookie('username', req.body.username);
  if(foundUser && foundPW){
    res.cookie('user_id', foundUser)
    console.log(users[foundUser.id]);
    res.redirect('/urls')
  } else if(foundUser && !foundPW){
    console.log('Wrong PW');
    res.status(403).send('Wrong password');
  } else if(!foundUser) {
    console.log('Cannot find user');
    res.status(403).send('No such user');
  }
  //res.redirect('/urls');
})

app.get("/logout", (req, res) => {
  res.clearCookie('user_id').redirect('/urls');
})

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render('register', templateVars);
})


app.post('/register', (req, res) => {
  if(req.body.password === '' || req.body.email === ''){
    res.status(400).send("Error 400");
  } 
  if(checkSubPresence(users, 'email', req.body.email)){
    res.status(400).send("Already registered");
  }
  let rID = grs(3);
  let newUser = {
    id: rID,
    email: req.body.email,
    password: req.body.password
  }
  
  users[rID] = newUser;
  console.log(users);
  res.cookie('user_id', newUser.id).redirect('/urls');
})

//generates random string of length [n]
const grs = function generateRandomString(n) {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < n; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const checkSubPresence = function checkSubObjectForKeyValue(object, key, value){
  for(entry in object){
    if(object[entry][key] === value){
      return entry;
    }
  }
  return false;
}