const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../app');
const { usersModel, clientsModel, projectsModel } = require('../models');

describe('Project API endpoints', () => {
  let token;
  let clientId;
  let projectId;
  
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123'
  };
  
  const testClient = {
    name: 'Test Client for Projects',
    nif: 'A12345678',
  };
  
  const testProject = {
    name: 'Test Project',
    description: 'This is a test project',
    startDate: new Date().toISOString()
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
    
    // Crear un cliente para asociar al proyecto
    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(testClient);
    
    clientId = clientRes.body.client._id;
    testProject.client = clientId;
  });
  
  afterAll(async () => {
    // Limpiar datos de prueba
  await projectsModel.deleteMany({ name: 'Test Project' });
  await clientsModel.deleteMany({ name: 'Test Client for Projects' });
  await usersModel.deleteMany({ email: testUser.email });
  await new Promise(resolve => server.close(resolve));
  await mongoose.connection.close();
  });
  
  describe('POST /api/project', () => {
    it('should create a new project', async () => {
      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send(testProject);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('project');
      expect(res.body.project).toHaveProperty('_id');
      expect(res.body.project).toHaveProperty('name', testProject.name);
      
      projectId = res.body.project._id;
    });
  });
  
  describe('GET /api/project', () => {
    it('should get all projects for the user', async () => {
      const res = await request(app)
        .get('/api/project')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('projects');
      expect(Array.isArray(res.body.projects)).toBeTruthy();
      expect(res.body.projects.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/project/:id', () => {
    it('should get a specific project by id', async () => {
      const res = await request(app)
        .get(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('project');
      expect(res.body.project).toHaveProperty('_id', projectId);
      expect(res.body.project).toHaveProperty('name', testProject.name);
    });
  });
  
  describe('PUT /api/project/:id', () => {
    it('should update a project', async () => {
      const updateData = {
        name: 'Updated Test Project',
        description: 'This project has been updated',
        client: clientId
      };
      
      const res = await request(app)
        .put(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('project');
      expect(res.body.project).toHaveProperty('name', updateData.name);
      expect(res.body.project).toHaveProperty('description', updateData.description);
    });
  });
  
  describe('DELETE /api/project/:id', () => {
    it('should archive a project (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'PROJECT_ARCHIVED');
    });
  });
  
  describe('GET /api/project/archived', () => {
    it('should get all archived projects', async () => {
      const res = await request(app)
        .get('/api/project/archived')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('projects');
      expect(Array.isArray(res.body.projects)).toBeTruthy();
      expect(res.body.projects.length).toBeGreaterThan(0);
    });
  });
  
  describe('PUT /api/project/restore/:id', () => {
    it('should restore an archived project', async () => {
      const res = await request(app)
        .put(`/api/project/restore/${projectId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'PROJECT_RESTORED');
    });
  });
});