const express = require("express");
const router = express.Router();
const { validatorCreateClient, validatorUpdateClient ,validatorGetClient } = require("../validators/clients");
const authMiddleware = require("../middleware/session");
const { 
    createClient, 
    getClients, 
    getClient, 
    updateClient, 
    deleteClient, 
    getArchivedClients, 
    restoreClient 
} = require("../controllers/client");

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: API para gestión de clientes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: ID autogenerado del cliente
 *         name:
 *           type: string
 *           description: Nombre del cliente
 *         nif:
 *           type: string
 *           description: NIF del cliente
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             number:
 *               type: number
 *             postal:
 *               type: number
 *             city:
 *               type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         createdBy:
 *           type: string
 *           description: ID del usuario que creó el cliente
 *         company:
 *           type: string
 *           description: ID de la compañía
 *       example:
 *         name: Empresa Ejemplo S.L.
 *         nif: B12345678
 *         address:
 *           street: Calle Principal
 *           number: 123
 *           postal: 28001
 *           city: Madrid
 *         email: contacto@empresa-ejemplo.com
 *         phone: 912345678
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);


/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       409:
 *         description: El cliente ya existe
 *       500:
 *         description: Error del servidor
 */

router.post("/", validatorCreateClient, createClient);

/**
 * @swagger
 * /api/client:
 *   get:
 *     summary: Obtener todos los clientes
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       500:
 *         description: Error del servidor
 */

router.get("/", getClients);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     summary: Obtener clientes archivados
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       500:
 *         description: Error del servidor
 */

router.get("/archived", getArchivedClients);

/**
 * @swagger
 * /api/client/restore/{id}:
 *   put:
 *     summary: Restaurar un cliente archivado
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente restaurado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *                 message:
 *                   type: string
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put("/restore/:id", validatorGetClient, restoreClient);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Obtener un cliente específico
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Detalles del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error del servidor
 */

router.get("/:id", validatorGetClient, getClient);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     summary: Actualizar un cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put("/:id", validatorUpdateClient, updateClient);

/**
 * @swagger
 * /api/client/{id}:
 *   patch:
 *     summary: Actualizar parcialmente un cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error del servidor
 */

router.patch("/:id", validatorUpdateClient, updateClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     summary: Eliminar un cliente (soft/hard delete)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del cliente
 *       - in: query
 *         name: hard
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Si es 'true', realiza hard delete, de lo contrario soft delete
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error del servidor
 */

router.delete("/:id", validatorGetClient, deleteClient);

module.exports = router;