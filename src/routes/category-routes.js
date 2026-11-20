const express = require('express');
const controller = require('../controllers/category-controller');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../services/async-handler');
const router = express.Router();

router.get('/search', asyncHandler(controller.search));
router.get('/:id', asyncHandler(controller.get));
router.post('/', authenticate, asyncHandler(controller.create));
router.put('/:id', authenticate, asyncHandler(controller.update));
router.delete('/:id', authenticate, asyncHandler(controller.remove));

module.exports = router;
