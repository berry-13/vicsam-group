const express = require('express');
const authRoutes = require('./authRoutes');
const dataRoutes = require('./dataRoutes');
const downloadRoutes = require('./downloadRoutes');
const versionRoutes = require('./versionRoutes');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/data', dataRoutes);

router.use('/', downloadRoutes);

router.use('/version', versionRoutes);

router.use('/', healthRoutes);

module.exports = router;
