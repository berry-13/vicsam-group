const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { generateFileName } = require('../utils/helpers');

class FileService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../');
    this.generalFilePath = path.join(this.dataDir, 'dati_generali.json');
  }

  /**
   * Salva i dati JSON in un file specifico basato sul CustomerVAT
   * Se il file esiste già, lo aggiorna
   * @param {Object} data - Dati JSON da salvare
   * @returns {Promise<{fileName: string, isUpdate: boolean}>} Nome del file e se è un aggiornamento
   */
  async saveData(data) {
    try {
      // Verifica che data sia un oggetto valido
      if (!data || typeof data !== 'object') {
        throw new Error('I dati forniti non sono un oggetto JSON valido');
      }
      
      // Estrae il CustomerVAT dal JSON
      const customerVAT = data.CustomerVAT;
      
      if (!customerVAT) {
        console.error('Dati ricevuti:', JSON.stringify(data, null, 2));
        throw new Error('CustomerVAT è richiesto nel JSON per salvare il file');
      }
      
      // Verifica che CustomerVAT non sia vuoto
      if (typeof customerVAT !== 'string' || customerVAT.trim() === '') {
        throw new Error('CustomerVAT deve essere una stringa non vuota');
      }
      
      // Sanitizza il CustomerVAT per il nome del file (rimuove caratteri non validi)
      const sanitizedVAT = customerVAT.toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `dati_${sanitizedVAT}.json`;
      const filePath = path.join(this.dataDir, fileName);
      
      // Verifica se il file esiste già
      const fileExists = fsSync.existsSync(filePath);
      
      // Salva i dati JSON così come sono, senza validazione
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      console.log(`✅ File salvato con successo: ${fileName} (CustomerVAT: ${customerVAT})`);
      
      return {
        fileName,
        isUpdate: fileExists
      };
    } catch (error) {
      console.error('Errore nel FileService.saveData:', error);
      throw new Error(`Errore nel salvataggio dei dati: ${error.message}`);
    }
  }

  /**
   * Ottiene la lista di tutti i file di dati
   * @returns {Promise<Array>} Lista dei file
   */
  async getFilesList() {
    try {
      const files = await fs.readdir(this.dataDir);
      // Filtra per tutti i file .json (inclusi quelli con CustomerVAT) ma esclude i file di sistema
      const dataFiles = files.filter(f => 
        f.endsWith('.json') && 
        !f.startsWith('.') && 
        f !== 'package.json' &&
        f !== 'package-lock.json'
      );
      
      // Ordina i file per data di modifica (più recenti prima)
      const filesWithStats = await Promise.all(
        dataFiles.map(async (file) => {
          const filePath = path.join(this.dataDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: file.endsWith('.json') ? 'application/json' : 'unknown'
          };
        })
      );
      
      return filesWithStats.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      throw new Error(`Errore nel recupero della lista file: ${error.message}`);
    }
  }

  /**
   * Legge il contenuto di un file specifico
   * @param {string} filename - Nome del file
   * @returns {Promise<Object>} Contenuto del file
   */
  async getFileContent(filename) {
    try {
      // Validazione nome file per sicurezza
      if (!filename.endsWith('.json') || filename.includes('..')) {
        throw new Error('Nome file non valido');
      }
      
      const filePath = path.join(this.dataDir, filename);
      
      // Controlla se il file esiste
      if (!fsSync.existsSync(filePath)) {
        throw new Error('File non trovato');
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.message === 'File non trovato' || error.message === 'Nome file non valido') {
        throw error;
      }
      throw new Error(`Errore nella lettura del file: ${error.message}`);
    }
  }

  /**
   * Ottiene il percorso completo di un file per il download
   * @param {string} filename - Nome del file
   * @returns {string} Percorso completo del file
   */
  getFilePath(filename) {
    // Validazione nome file per sicurezza
    if (!filename.endsWith('.json') || filename.includes('..')) {
      throw new Error('Nome file non valido');
    }
    
    const filePath = path.join(this.dataDir, filename);
    
    if (!fsSync.existsSync(filePath)) {
      throw new Error('File non trovato');
    }
    
    return filePath;
  }

  /**
   * Elimina un file di dati
   * @param {string} filename - Nome del file da eliminare
   */
  async deleteFile(filename) {
    try {
      // Validazione nome file per sicurezza
      if (!filename.endsWith('.json') || filename.includes('..')) {
        throw new Error('Nome file non valido');
      }
      
      // Impedisce l'eliminazione di file di sistema
      const systemFiles = ['package.json', 'package-lock.json', 'dati_generali.json'];
      if (systemFiles.includes(filename)) {
        throw new Error('Impossibile eliminare questo file di sistema');
      }
      
      const filePath = path.join(this.dataDir, filename);
      
      if (!fsSync.existsSync(filePath)) {
        throw new Error('File non trovato');
      }
      
      await fs.unlink(filePath);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FileService();
