const express = require('express');
const controller = require('../controllers/user-controller');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../services/async-handler');
const router = express.Router();

router.post('/token', asyncHandler(controller.token));
router.post('/', asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.get));
router.put('/:id', authenticate, asyncHandler(controller.update));
router.delete('/:id', authenticate, asyncHandler(controller.remove));

module.exports = router;
