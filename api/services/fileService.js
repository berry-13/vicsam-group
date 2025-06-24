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
   * Salva i dati JSON in un file specifico con timestamp
   * Accetta qualsiasi struttura JSON senza validazione
   * @param {Object} data - Dati JSON da salvare
   * @returns {Promise<string>} Nome del file creato
   */
  async saveData(data) {
    try {
      const fileName = generateFileName('dati', 'json');
      const filePath = path.join(this.dataDir, fileName);
      
      // Salva i dati JSON così come sono, senza validazione
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      return fileName;
    } catch (error) {
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
      const dataFiles = files.filter(f => f.startsWith('dati_') && f.endsWith('.json'));
      
      // Aggiungi il file generale se esiste
      if (fsSync.existsSync(this.generalFilePath)) {
        dataFiles.push('dati_generali.json');
      }
      
      // Ordina i file per data di modifica (più recenti prima)
      const filesWithStats = await Promise.all(
        dataFiles.map(async (file) => {
          const filePath = path.join(this.dataDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
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
      if (!filename.endsWith('.json') || filename.includes('..') || filename === 'dati_generali.json') {
        throw new Error('Impossibile eliminare questo file');
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
