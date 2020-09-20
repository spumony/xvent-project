const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Event = require('../../models/Event');

// @route   GET api/events
// @desc    Test route
// @access  Public
router.get('/', (req, res) => {});

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

      if (event) {
        // Update
        event = await Event.findOneAndUpdate(
          { user: req.user.id },
          { $set: eventFields },
          { new: true }
        );

        return res.json(event);
      }

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

module.exports = router;
