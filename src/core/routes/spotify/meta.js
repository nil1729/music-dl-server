const express = require('express');
const router = express.Router();
const { getMetaHandler } = require('../../controller/spotify/meta');

router.route('/').get(getMetaHandler);

module.exports = router;
