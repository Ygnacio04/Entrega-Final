// test/testHelpers.js
const setupTestUser = async (app, request, userData) => {
    // Register user
    const registerRes = await request(app)
      .post('/api/user/register')
      .send(userData);
    
    const token = registerRes.body.token;
    const userId = registerRes.body.user._id;
    
    return { token, userId };
  };
  
  module.exports = { setupTestUser };   