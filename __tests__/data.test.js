const { createApp, getAuthHeaders, cleanupTestFiles, testData, request } = require('./helpers');
const fs = require('fs');
const path = require('path');

describe('Data API', () => {
  let app;
  
  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
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

    test('should reject invalid data', async () => {
      const response = await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    test('should reject unauthorized request', async () => {
      const response = await request(app)
        .post('/api/data/save')
        .send(testData.validUser)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should create general data file', async () => {
      await request(app)
        .post('/api/data/save')
        .set(getAuthHeaders())
        .send(testData.validUser)
        .expect(201);

      const generalFile = path.join(__dirname, '..', 'dati_generali.json');
      expect(fs.existsSync(generalFile)).toBe(true);
      
      const generalData = JSON.parse(fs.readFileSync(generalFile, 'utf8'));
      expect(Array.isArray(generalData)).toBe(true);
      expect(generalData).toHaveLength(1);
      expect(generalData[0]).toHaveProperty('nome', testData.validUser.nome);
      expect(generalData[0]).toHaveProperty('email', testData.validUser.email);
      expect(generalData[0]).toHaveProperty('data');
    });
  });

  describe('GET /api/data/files', () => {
    test('should return empty list when no files exist', async () => {
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
      expect(response.body.data.generalDataCount).toBe(1);
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
