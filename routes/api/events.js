const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Event = require('../../models/Event');

// @route   GET api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/events
// @desc    Create event
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
      check('date_start', 'Start date is required').notEmpty(),
      check('date_end', 'End date is required').notEmpty(),
      check('type', 'Type is required').notEmpty(),
      check('location', 'Location is required').notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      date_start,
      date_end,
      type,
      location,
      website,
      image,
      date,
    } = req.body;

    // Build event object
    const eventFields = {};
    eventFields.user = req.user.id;
    if (title) eventFields.title = title;
    if (description) eventFields.description = description;
    if (date_start) eventFields.date_start = date_start;
    if (date_end) eventFields.date_end = date_end;
    if (type) eventFields.type = type;
    if (location) eventFields.location = location;
    if (website) eventFields.website = website;
    if (image) eventFields.image = image;
    if (date) eventFields.date = date;

    try {
      let event = await Event.findOne({ user: req.user.id });

      // Create
      event = new Event(eventFields);

      await event.save();
      res.json(event);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }

    res.status(500).send('Server Error');
  }
});

module.exports = router;
