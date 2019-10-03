const { assert } = require('chai');

const { checkSubPresence } = require('../helpers.js');

const testUsers = {
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
};

describe('checkSubPresence', function() {
  it('should return a user with valid email', function() {
    const user = checkSubPresence(testUsers, "email", "user@example.com")
    const expectedOutput = "userRandomID";

    assert.strictEqual(user,expectedOutput);
  });

  it('should return false if attempting to return a user whose email is not in the "database"', function() {
    const user = checkSubPresence(testUsers, "email", "fake@fake.com")

    assert.strictEqual(user, false);
  })
});