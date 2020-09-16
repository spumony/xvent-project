const express = require('express');
const router = express.Router();

// @route   GET api/events
// @desc    Test route
// @access  Public
router.get('/', (req, res) => res.send('Events route'));

module.exports = router;
