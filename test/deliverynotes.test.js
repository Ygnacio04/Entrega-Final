const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { usersModel, clientsModel, projectsModel, deliveryNotesModel } = require('../models');
const path = require('path');

describe('Delivery Note API endpoints', () => {
  let token;
  let clientId;
  let projectId;
  let deliveryNoteId;
  
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123'
  };
  
  const testClient = {
    name: 'Test Client for DeliveryNotes',
    nif: 'A87654321',
  };
  
  const testProject = {
    name: 'Test Project for DeliveryNotes',
    description: 'This is a test project for delivery notes',
  };
  
  const testDeliveryNote = {
    date: new Date().toISOString(),
    workedHours: [
      {
        person: 'Test Worker',
        hours: 8,
        hourlyRate: 20,
        date: new Date().toISOString(),
        description: 'Development work'
      }
    ],
    materials: [
      {
        name: 'Test Material',
        quantity: 5,
        price: 10,
        description: 'Some material'
      }
    ],
    observations: 'Test observations'
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
        cif: 'B87654321'
      }
    });
    
    // Crear un cliente para asociar al proyecto
    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(testClient);
    
    clientId = clientRes.body.client._id;
    
    // Crear un proyecto para asociar al albarán
    testProject.client = clientId;
    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(testProject);
    
    projectId = projectRes.body.project._id;
    testDeliveryNote.project = projectId;
  });
  
  afterAll(async () => {
    // Limpiar datos de prueba
    await deliveryNotesModel.deleteMany({});
    await projectsModel.deleteMany({ name: 'Test Project for DeliveryNotes' });
    await clientsModel.deleteMany({ name: 'Test Client for DeliveryNotes' });
    await usersModel.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
  });
  
  describe('POST /api/deliverynote', () => {
    it('should create a new delivery note', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send(testDeliveryNote);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('deliveryNote');
      expect(res.body.deliveryNote).toHaveProperty('_id');
      expect(res.body.deliveryNote).toHaveProperty('number');
      
      deliveryNoteId = res.body.deliveryNote._id;
    });
  });
  
  describe('GET /api/deliverynote', () => {
    it('should get all delivery notes for the user', async () => {
      const res = await request(app)
        .get('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('deliveryNotes');
      expect(Array.isArray(res.body.deliveryNotes)).toBeTruthy();
      expect(res.body.deliveryNotes.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/deliverynote/:id', () => {
    it('should get a specific delivery note by id', async () => {
      const res = await request(app)
        .get(`/api/deliverynote/${deliveryNoteId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('deliveryNote');
      expect(res.body.deliveryNote).toHaveProperty('_id', deliveryNoteId);
    });
  });
  
  describe('PUT /api/deliverynote/:id', () => {
    it('should update a delivery note', async () => {
      const updateData = {
        observations: 'Updated observations',
        project: projectId
      };
      
      const res = await request(app)
        .put(`/api/deliverynote/${deliveryNoteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('deliveryNote');
      expect(res.body.deliveryNote).toHaveProperty('observations', updateData.observations);
    });
  });
  
  describe('GET /api/deliverynote/pdf/:id', () => {
    it('should generate a PDF for a delivery note', async () => {
      const res = await request(app)
        .get(`/api/deliverynote/pdf/${deliveryNoteId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });
  
  // Nota: El test de firma requiere un archivo, lo que es difícil de simular en un test unitario
  // pero podría hacerse con un mock o un archivo de prueba
  
  describe('DELETE /api/deliverynote/:id', () => {
    it('should delete a delivery note', async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/${deliveryNoteId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'DELIVERY_NOTE_ARCHIVED');
    });
  });
});