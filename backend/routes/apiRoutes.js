const express = require('express');

module.exports = (apiController) => {
  const router = express.Router();

  router.post('/polls', apiController.createPoll);
  router.get('/polls/:pollId', apiController.getPoll);
  router.post('/polls/:pollId/end', apiController.endPoll);

  return router;
};
