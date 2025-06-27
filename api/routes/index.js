const express = require('express');
const authRoutes = require('./authRoutes');
const dataRoutes = require('./dataRoutes');
const downloadRoutes = require('./downloadRoutes');

const router = express.Router();

// Rotte di autenticazione
router.use('/auth', authRoutes);

// Rotte per la gestione dei dati
router.use('/data', dataRoutes);

// Rotte per il download dei file
router.use('/download', downloadRoutes);

module.exports = router;
