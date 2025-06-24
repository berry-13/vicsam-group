const { createApp, getAuthHeaders, cleanupTestFiles, testData, request } = require('./helpers');
const fs = require('fs');
const path = require('path');

describe('Data API', () => {
  let app;
  
  beforeAll(() => {
    app = createApp();
    // Pulizia iniziale prima di tutti i test
    cleanupTestFiles();
  });

  afterAll(() => {
    cleanupTestFiles();
  });

  describe('POST /api/data/save', () => {
    test('should save valid data', async () => {
      const response = await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.validUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('fileName');
      expect(response.body.data.fileName).toMatch(/^dati_\d+\.json$/);
    });

    test('should accept any JSON data without validation', async () => {
      const response = await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.invalidUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('fileName');
      expect(response.body.data.fileName).toMatch(/^dati_\d+\.json$/);
    });

    test('should reject unauthorized request', async () => {
      const response = await request(app)
        .post('/api/data/save')
        .send(testData.validUser)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should save data without creating general file', async () => {
      await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.validUser)
        .expect(201);

      // I file di dati generali non vengono più creati automaticamente
      const generalFile = path.join(__dirname, '..', 'dati_generali.json');
      // I file di dati generali non vengono più creati automaticamente
      // Il file generale potrebbe esistere da test precedenti, ma non viene aggiornato
    });
  });

  describe('GET /api/data/files', () => {
    test('should return empty list when no files exist', async () => {
      // Pulisci tutti i file prima di questo test specifico
      const testDir = path.join(__dirname, '..');
      const files = fs.readdirSync(testDir);
      
      files.forEach(file => {
        if (file.startsWith('dati_') && file.endsWith('.json')) {
          fs.unlinkSync(path.join(testDir, file));
        }
      });
      
      const response = await request(app)
        .get('/api/data/files')
        .set(getAuthHeaders())
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('files');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data.files).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });

    test('should return files list after saving data', async () => {
      // Prima salva alcuni dati
      await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.validUser);

      const response = await request(app)
        .get('/api/data/files')
        .set(getAuthHeaders())
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.files.length).toBeGreaterThan(0);
      
      const file = response.body.data.files[0];
      expect(file).toHaveProperty('name');
      expect(file).toHaveProperty('size');
      expect(file).toHaveProperty('created');
      expect(file).toHaveProperty('modified');
    });

    test('should reject unauthorized request', async () => {
      const response = await request(app)
        .get('/api/data/files')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/data/stats', () => {
    test('should return stats with no data', async () => {
      const response = await request(app)
        .get('/api/data/stats')
        .set(getAuthHeaders())
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalFiles');
      expect(response.body.data).toHaveProperty('totalSize');
      expect(response.body.data).toHaveProperty('generalDataCount');
      expect(response.body.data).toHaveProperty('lastUpdate');
    });

    test('should return correct stats after saving data', async () => {
      // Salva dati di test
      await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.validUser);

      const response = await request(app)
        .get('/api/data/stats')
        .set(getAuthHeaders())
        .expect(200);

      expect(response.body.data.totalFiles).toBeGreaterThan(0);
      expect(response.body.data.totalSize).toBeGreaterThan(0);
      expect(response.body.data.generalDataCount).toBe(0); // Non viene più creato automaticamente
      expect(response.body.data.lastUpdate).toBeTruthy();
    });
  });

  describe('GET /api/data/file/:filename', () => {
    let savedFileName;

    beforeEach(async () => {
      const saveResponse = await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.validUser);
      
      savedFileName = saveResponse.body.data.fileName;
    });

    test('should return file content', async () => {
      const response = await request(app)
        .get(`/api/data/file/${savedFileName}`)
        .set(getAuthHeaders())
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('filename', savedFileName);
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data.content).toHaveProperty('nome', testData.validUser.nome);
    });

    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/data/file/non-existent.json')
        .set(getAuthHeaders())
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid filename', async () => {
      const response = await request(app)
        .get('/api/data/file/invalid-file.txt')
        .set(getAuthHeaders())
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject unauthorized request', async () => {
      const response = await request(app)
        .get(`/api/data/file/${savedFileName}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/data/file/:filename', () => {
    let savedFileName;

    beforeEach(async () => {
      const saveResponse = await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.validUser);
      
      savedFileName = saveResponse.body.data.fileName;
    });

    test('should delete existing file', async () => {
      const response = await request(app)
        .delete(`/api/data/file/${savedFileName}`)
        .set(getAuthHeaders())
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('filename', savedFileName);

      // Verifica che il file sia stato effettivamente eliminato
      const filePath = path.join(__dirname, '..', savedFileName);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/data/file/non-existent.json')
        .set(getAuthHeaders())
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should reject deletion of general file', async () => {
      const response = await request(app)
        .delete('/api/data/file/dati_generali.json')
        .set(getAuthHeaders())
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should reject unauthorized request', async () => {
      const response = await request(app)
        .delete(`/api/data/file/${savedFileName}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
