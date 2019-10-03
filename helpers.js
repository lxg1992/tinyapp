const grs = function generateRandomString(n) {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < n; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const urlsForUser = function(id, database) {
  let retObj = {};
  for (let item in database) {
    if (database[item].userID === id) {
      retObj[item] = database[item];
    }
  }
  return retObj;
};

const checkSubPresence = function checkSubObjectForKeyValue(object, key, value) {
  for (entry in object) {
    if (object[entry][key] === value) {
      return entry;
    }
  }
  return false;
};

module.exports = {
  grs,
  urlsForUser,
  checkSubPresence
};