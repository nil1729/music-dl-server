const express = require('express');
const router = express.Router();

router.use('/metadata', require('./meta'));

module.exports = router;
