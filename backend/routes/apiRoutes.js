const express = require('express');
const { authorizationLimiter } = require('../middleware/rateLimiter');

module.exports = (apiController) => {
  const router = express.Router();

  router.post('/polls', apiController.createPoll);
  router.get('/polls/:pollId', apiController.getPoll);
  // Apply strict rate limiting to the authorization endpoint to prevent brute force attacks
  router.post('/polls/:pollId/end', authorizationLimiter, apiController.endPoll);

  return router;
};
