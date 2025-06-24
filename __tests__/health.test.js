const { createApp, request } = require('./helpers');

describe('Health Check API', () => {
  let app;
  
  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    test('should return server health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server is running');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version', '2.0.0');
      
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should return valid timestamp format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      const date = new Date(timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    test('should be accessible without authentication', async () => {
      // Test che l'endpoint sia pubblico
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/data/save')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${process.env.BEARER_TOKEN}`)
        .send('invalid json')
        .expect(400);

      // Il middleware di Express dovrebbe gestire l'errore di parsing JSON con status 400
      expect(response.status).toBe(400);
    });
  });
});
