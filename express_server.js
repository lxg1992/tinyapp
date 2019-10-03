const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080; // default port 8080

//server command: ./node_modules/.bin/nodemon -L express_server.js 

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['lol'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
    password: bcrypt.hashSync("pud",10)
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
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase, user: users[req.session.user_id]};
  

  if(templateVars.user) {
    templateVars = {urls: urlsForUser(req.session.user_id, urlDatabase), user: users[req.session.user_id]}
    console.log(templateVars)
    res.render("urls_index", templateVars);
  } else {
    res.send("Please login first");
  }
});

app.get("/hello", function(req,res) {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
  
});

app.get("/urls/:shortURL", (req,res) => {
  let urlObj = urlsForUser(req.session.user_id, urlDatabase);
  let params = req.params;
  for (let short in urlObj){
    if(short === req.params.shortURL){
      console.log(short);
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

app.post("/urls", (req, res) => {
  
  
  let val = req.body.longURL;
  let key = grs(6);
  urlDatabase[key] = {longURL: val, userID: req.session.user_id};
  res.redirect(`/urls/${key}`);
  console.log(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
})

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.updatedURL;
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
  let foundPW = bcrypt.compareSync(req.body.password, users[foundUser].password);
  
  //res.cookie('username', req.body.username);
  if(foundUser && foundPW){
    req.session.user_id = foundUser
    console.log(users[foundUser]);
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
  req.session = null;
  res.redirect('/urls');
})

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
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
  let hashedPW = bcrypt.hashSync(req.body.password, 10);
  let rID = grs(3);
  let newUser = {
    id: rID,
    email: req.body.email,
    password: hashedPW
  }
  
  users[rID] = newUser;
  console.log(users);
  req.session.user_id = newUser.id
  res.redirect('/urls');
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

const urlsForUser = function(id, database){
  let retObj = {};
  for (let item in database){
    if (database[item].userID === id){
      retObj[item] = database[item];
    }
  }
  return retObj;

}