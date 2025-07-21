// routes/category.routes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const {authenticate} = require('../middleware/auth');

router.use(authenticate); // Apply auth to all category routes

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);

module.exports = router;
