const express = require("express");
const router = express.Router();
const { validatorCreateProject, validatorGetProject } = require("../validators/projects");
const authMiddleware = require("../middleware/session");
const { 
    createProject, 
    getProjects, 
    getProject, 
    updateProject, 
    deleteProject, 
    getArchivedProjects, 
    restoreProject 
} = require("../controllers/projects");

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: API para gestión de proyectos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - client
 *       properties:
 *         _id:
 *           type: string
 *           description: ID autogenerado del proyecto
 *         name:
 *           type: string
 *           description: Nombre del proyecto
 *         description:
 *           type: string
 *           description: Descripción del proyecto
 *         client:
 *           type: string
 *           description: ID del cliente asociado al proyecto
 *         createdBy:
 *           type: string
 *           description: ID del usuario que creó el proyecto
 *         company:
 *           type: string
 *           description: ID de la compañía
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de inicio del proyecto
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de finalización del proyecto
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed, cancelled]
 *           description: Estado actual del proyecto
 *       example:
 *         name: Proyecto Website
 *         description: Desarrollo de sitio web corporativo
 *         client: 60d725b67be3da1254f3dba9
 *         startDate: 2023-01-15T00:00:00.000Z
 *         status: in-progress
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * @swagger
 * /api/project:
 *   post:
 *     summary: Crear un nuevo proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Proyecto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Cliente no encontrado
 *       409:
 *         description: El proyecto ya existe
 *       500:
 *         description: Error del servidor
 */

router.post("/", validatorCreateProject, createProject);

/**
 * @swagger
 * /api/project:
 *   get:
 *     summary: Obtener todos los proyectos
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filtrar proyectos por cliente
 *     responses:
 *       200:
 *         description: Lista de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       500:
 *         description: Error del servidor
 */

router.get("/", getProjects);

/**
 * @swagger
 * /api/project/archived:
 *   get:
 *     summary: Obtener proyectos archivados
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       500:
 *         description: Error del servidor
 */

router.get("/archived", getArchivedProjects);

/**
 * @swagger
 * /api/project/restore/{id}:
 *   put:
 *     summary: Restaurar un proyecto archivado
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del proyecto
 *     responses:
 *       200:
 *         description: Proyecto restaurado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *       404:
 *         description: Proyecto no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put("/restore/:id", validatorGetProject, restoreProject);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Obtener un proyecto específico
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del proyecto
 *     responses:
 *       200:
 *         description: Detalles del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Proyecto no encontrado
 *       500:
 *         description: Error del servidor
 */

router.get("/:id", validatorGetProject, getProject);

/**
 * @swagger
 * /api/project/{id}:
 *   put:
 *     summary: Actualizar un proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Proyecto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Proyecto o cliente no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put("/:id", validatorCreateProject, updateProject);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Eliminar un proyecto (soft/hard delete)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del proyecto
 *       - in: query
 *         name: hard
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Si es 'true', realiza hard delete, de lo contrario soft delete
 *     responses:
 *       200:
 *         description: Proyecto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Proyecto no encontrado
 *       500:
 *         description: Error del servidor
 */

router.delete("/:id", validatorGetProject, deleteProject);

module.exports = router;