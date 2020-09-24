const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Event = require('../../models/Event');
const User = require('../../models/User');

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

// @route   GET api/events/m
// @desc    Get all user's events
// @access  Private
router.get('/m', auth, async (req, res) => {
  try {
    const events = await Event.find({ user: req.user.id });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/id/:id', async (req, res) => {
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

// @route   GET api/events/:id
// @desc    Get all event participants
// @access  Private
router.get('/id/:id/participants', auth, async (req, res) => {
  try {
    const participants = await Event.find(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        participants: 1,
      }
    );

    res.json(participants);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }

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
      check('dateStart', 'Start date is required').notEmpty(),
      check('dateEnd', 'End date is required').notEmpty(),
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
      dateStart,
      dateEnd,
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
    if (dateStart) eventFields.dateStart = dateStart;
    if (dateEnd) eventFields.dateEnd = dateEnd;
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

// @route   PUT api/events
// @desc    Edit event
// @access  Private
router.put(
  '/id/:id',
  [
    auth,
    [
      check('title', 'Title is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
      check('dateStart', 'Start date is required').notEmpty(),
      check('dateEnd', 'End date is required').notEmpty(),
      check('type', 'Type is required').notEmpty(),
      check('location', 'Location is required').notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const {
      title,
      description,
      dateStart,
      dateEnd,
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
    if (dateStart) eventFields.dateStart = dateStart;
    if (dateEnd) eventFields.dateEnd = dateEnd;
    if (type) eventFields.type = type;
    if (location) eventFields.location = location;
    if (website) eventFields.website = website;
    if (image) eventFields.image = image;
    if (date) eventFields.date = date;

    try {
      const event = await Event.updateOne(
        {
          user: req.user.id,
          _id: req.params.id,
        },
        {
          $set: {
            title,
            description,
            dateStart,
            dateEnd,
            type,
            location,
          },
        }
      );

      res.json(event);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/events/:id
// @desc    Registration on event
// @access  Public
router.post(
  '/id/:id',
  [
    check('name', 'Name is required').notEmpty(),
    check('phone', 'Phone number is required').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Create unique code for participant
    const shortId = shortid.generate();

    const newParticipant = {
      name: req.body.name,
      phone: req.body.phone,
      shortId,
    };

    try {
      const event = await Event.findById(req.params.id);
      const participant = await Event.find({
        _id: req.params.id,
        'participants.phone': req.body.phone,
      });

      // Check if participant exists
      if (participant.length > 0) {
        return res.status(200).send('You are already registred');
      }

      // Add participant to collection and save
      event.participants.push(newParticipant);
      await event.save();

      res.status(200).send(shortId);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/events/status
// @desc    Check registration status
// @access  Public
router.post(
  '/status',
  [check('shortId', 'Registration code is required').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const event = await Event.find({
        'participants.shortId': req.body.shortId,
      });

      // Check if participant exists
      if (event.length === 0) {
        return res.status(404).send('Wrong registration code');
      }

      const getStatus = event[0].participants.filter((p) => {
        if (p.shortId === req.body.shortId) {
          return p;
        }
      });

      const status = {
        name: getStatus[0].name,
        phone: getStatus[0].phone,
        shortId: getStatus[0].shortId,
        status: getStatus[0].status,
      };

      res.status(200).send(status);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/events/id/:id/participants
// @desc    Edit participant's status
// @access  Private
router.put(
  '/id/:id/participants',
  [
    auth,
    check('status', 'Status is required').notEmpty(),
    check('shortId', 'Participant id is required').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    try {
      const participant = await Event.updateOne(
        {
          user: req.user.id,
          _id: req.params.id,
          'participants.shortId': req.body.shortId,
        },
        {
          $set: { 'participants.$.status': req.body.status },
        }
      );

      res.status(200).send('Status changed');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/events
// @desc    Delete event
// @access  Private
router.delete('/id/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    // Check if user created event
    if (req.user.id == event.user) {
      // Delete event
      await Event.findOneAndRemove({
        user: req.user.id,
        _id: req.params.id,
      });
      return res.json({ msg: 'Event deleted' });
    }

    res.json({ msg: 'It is NOT your event' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
