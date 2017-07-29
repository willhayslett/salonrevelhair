
const express = require('express');

const router = new express.Router();

const appointmentRequest = require('./makeappointment.js');
router.use('/api/correspondence/appointment/request', appointmentRequest);

console.log('made it to handlers')
module.exports = router; //export our routes for use