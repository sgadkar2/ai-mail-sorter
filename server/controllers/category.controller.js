// controllers/category.controller.js
const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
  const name = req.body.name.trim().toLowerCase(); // Normalize to lowercase
  const description = req.body.description;
  const userId = req.user._id;

  try {
    // Check for existing category with same name (case-insensitive)
    const existing = await Category.findOne({ name, user: userId });
    if (existing) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const category = await Category.create({ name, description, user: userId });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category', details: err.message });
  }
};

exports.getCategories = async (req, res) => {
  const userId = req.user._id;

  try {
    const categories = await Category.find({ user: userId });
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories', details: err.message });
  }
};
