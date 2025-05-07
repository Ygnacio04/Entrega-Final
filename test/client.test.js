const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../app'); 
const { usersModel, clientsModel } = require('../models');

describe('Client API endpoints', () => {
  let token;
  let clientId;
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123'
  };
  const testClient = {
    name: 'Test Client',
    nif: 'A12345678',
    address: {
      street: 'Test Street',
      number: 123,
      postal: 28001,
      city: 'Madrid'
    },
    email: 'client@example.com',
    phone: '123456789'
  };

  beforeAll(async () => {
    // Registrar y autenticar usuario de prueba
    const registerRes = await request(app)
      .post('/api/user/register')
      .send(testUser);
    
    token = registerRes.body.token;

    // Establecer compañía para el usuario
    await usersModel.findByIdAndUpdate(registerRes.body.user._id, {
      company: {
        name: 'Test Company',
        cif: 'B12345678'
      }
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await clientsModel.deleteMany({ name: 'Test Client' });
    await usersModel.deleteMany({ email: testUser.email });
    await new Promise(resolve => server.close(resolve));
    await mongoose.connection.close();
  });

  describe('POST /api/client', () => {
    it('should create a new client', async () => {
      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send(testClient);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('client');
      expect(res.body.client).toHaveProperty('_id');
      expect(res.body.client).toHaveProperty('name', testClient.name);
      
      clientId = res.body.client._id;
    });

    it('should not create a client with the same name', async () => {
      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send(testClient);

      expect(res.statusCode).toEqual(409);
    });
  });

  describe('GET /api/client', () => {
    it('should get all clients for the user', async () => {
      const res = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('clients');
      expect(Array.isArray(res.body.clients)).toBeTruthy();
      expect(res.body.clients.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/client/:id', () => {
    it('should get a specific client by id', async () => {
      const res = await request(app)
        .get(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('client');
      expect(res.body.client).toHaveProperty('_id', clientId);
      expect(res.body.client).toHaveProperty('name', testClient.name);
    });

    it('should return 404 for non-existent client', async () => {
      const res = await request(app)
        .get('/api/client/60a1c123b6d4a50c3aaaaaa1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/client/:id', () => {
    it('should update a client', async () => {
      const updateData = {
        name: 'Updated Test Client',
        email: 'updated@example.com'
      };

      const res = await request(app)
        .put(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('client');
      expect(res.body.client).toHaveProperty('name', updateData.name);
      expect(res.body.client).toHaveProperty('email', updateData.email);
    });
  });

  describe('DELETE /api/client/:id', () => {
    it('should archive a client (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/client/${clientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'CLIENT_ARCHIVED');
    });
  });

  describe('GET /api/client/archived', () => {
    it('should get all archived clients', async () => {
      const res = await request(app)
        .get('/api/client/archived')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('clients');
      expect(Array.isArray(res.body.clients)).toBeTruthy();
      expect(res.body.clients.length).toBeGreaterThan(0);
      expect(res.body.clients.some(client => client._id === clientId)).toBeTruthy();
    });
  });

  describe('PUT /api/client/restore/:id', () => {
    it('should restore an archived client', async () => {
      const res = await request(app)
        .put(`/api/client/restore/${clientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'CLIENT_RESTORED');
      expect(res.body).toHaveProperty('client');
      expect(res.body.client._id).toEqual(clientId);
    });
  });

  describe('DELETE /api/client/:id?hard=true', () => {
    it('should permanently delete a client (hard delete)', async () => {
      const res = await request(app)
        .delete(`/api/client/${clientId}?hard=true`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'CLIENT_DELETED_PERMANENTLY');
    });
  });
});