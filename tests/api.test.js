process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret';

const request = require('supertest');
const app = require('../src/app');

describe('API routes and middleware', () => {
  test('returns 404 for an unknown route', async () => {
    const response = await request(app).get('/not-a-route');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Endpoint not found' });
  });

  test('requires a bearer token on protected category writes', async () => {
    const response = await request(app).post('/v1/category').send({ name: 'Shoes', slug: 'shoes' });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Authorization Bearer token/);
  });

  test('requires a bearer token on protected product writes', async () => {
    const response = await request(app).delete('/v1/product/1');
    expect(response.status).toBe(400);
  });
});
