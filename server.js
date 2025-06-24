const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// percorso del file "generale"
const generalFilePath = path.join(__dirname, 'dati_generali.json');

// i campi che vogliamo estrarre dai dati inviati
function estraiDatiImportanti(body) {
  return {
    nome: body.nome,
    email: body.email,
    data: new Date().toISOString()
  };
}

app.post('/salva', (req, res) => {
  const body = req.body;
  const timestamp = Date.now();
  const filePath = path.join(__dirname, `dati_${timestamp}.json`);

  fs.writeFileSync(filePath, JSON.stringify(body, null, 2));

  let datiGenerali = [];
  if (fs.existsSync(generalFilePath)) {
    datiGenerali = JSON.parse(fs.readFileSync(generalFilePath));
  }
  datiGenerali.push(estraiDatiImportanti(body));
  fs.writeFileSync(generalFilePath, JSON.stringify(datiGenerali, null, 2));

  res.json({ message: 'Dati salvati con successo!' });
});

const PASSWORD = "supersegreta"; // Cambia questa password a piacere

// Middleware per autenticazione semplice
function checkPassword(req, res, next) {
  const password = req.headers["x-access-password"] || req.body.password;
  if (password !== PASSWORD) {
    return res.status(401).json({ error: "Password errata" });
  }
  next();
}

// Endpoint per elencare tutti i file dati_*.json e dati_generali.json
app.get('/files', checkPassword, (req, res) => {
  const files = fs.readdirSync(__dirname)
    .filter(f => f.startsWith('dati_') && f.endsWith('.json'));
  files.push('dati_generali.json');
  res.json({ files });
});

// Endpoint per visualizzare il contenuto di un file
app.get('/file/:filename', checkPassword, (req, res) => {
  const { filename } = req.params;
  if (!filename.endsWith('.json')) return res.status(400).json({ error: 'Formato non valido' });
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File non trovato' });
  const content = fs.readFileSync(filePath, 'utf-8');
  res.json({ content: JSON.parse(content) });
});

// Endpoint per scaricare un file
app.get('/download/:filename', checkPassword, (req, res) => {
  const { filename } = req.params;
  if (!filename.endsWith('.json')) return res.status(400).json({ error: 'Formato non valido' });
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File non trovato' });
  res.download(filePath);
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
