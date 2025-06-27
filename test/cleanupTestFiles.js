// test/cleanupTestFiles.js
// Utility to remove all test .json files except system files and dati_generali.json
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'dati');
const systemFiles = ['package.json', 'package-lock.json', 'dati_generali.json'];

// Verifica che la cartella dati esista
if (fs.existsSync(dataDir)) {
  fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json') && !systemFiles.includes(f))
    .forEach(f => {
      try {
        fs.unlinkSync(path.join(dataDir, f));
        console.log('Deleted test file:', f);
      } catch (e) {
        console.error('Failed to delete', f, e);
      }
    });
} else {
  console.log('Data directory does not exist yet');
}
