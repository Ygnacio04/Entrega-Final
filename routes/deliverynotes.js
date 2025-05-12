const express = require("express");
const router = express.Router();
const { uploadMiddlewareMemory } = require("../utils/handleStorage");
const { validatorCreateDeliveryNote, validatorGetDeliveryNote } = require("../validators/deliverynotes");
const authMiddleware = require("../middleware/session");
const { 
    createDeliveryNote, 
    getDeliveryNotes, 
    getDeliveryNote, 
    updateDeliveryNote, 
    deleteDeliveryNote, 
    signDeliveryNote, 
    getDeliveryNotePdf 
} = require("../controllers/deliverynotes");

/**
 * @swagger
 * tags:
 *   name: DeliveryNotes
 *   description: API para gestión de albaranes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkedHours:
 *       type: object
 *       required:
 *         - person
 *         - hours
 *       properties:
 *         person:
 *           type: string
 *           description: Nombre de la persona
 *         hours:
 *           type: number
 *           description: Número de horas trabajadas
 *         date:
 *           type: string
 *           format: date-time
 *           description: Fecha del trabajo
 *         description:
 *           type: string
 *           description: Descripción del trabajo
 *         hourlyRate:
 *           type: number
 *           description: Tarifa por hora
 *       example:
 *         person: Juan Pérez
 *         hours: 8
 *         date: 2023-06-15T09:00:00.000Z
 *         description: Desarrollo frontend
 *         hourlyRate: 25
 *
 *     Material:
 *       type: object
 *       required:
 *         - name
 *         - quantity
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del material
 *         quantity:
 *           type: number
 *           description: Cantidad
 *         price:
 *           type: number
 *           description: Precio unitario
 *         description:
 *           type: string
 *           description: Descripción del material
 *       example:
 *         name: Módulo RAM
 *         quantity: 2
 *         price: 45
 *         description: 8GB DDR4
 *
 *     DeliveryNote:
 *       type: object
 *       required:
 *         - project
 *       properties:
 *         _id:
 *           type: string
 *           description: ID autogenerado del albarán
 *         number:
 *           type: string
 *           description: Número de albarán
 *         project:
 *           type: string
 *           description: ID del proyecto asociado
 *         date:
 *           type: string
 *           format: date-time
 *           description: Fecha del albarán
 *         workedHours:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WorkedHours'
 *         materials:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Material'
 *         status:
 *           type: string
 *           enum: [draft, pending, signed, cancelled]
 *           description: Estado del albarán
 *         observations:
 *           type: string
 *           description: Observaciones
 *         totalAmount:
 *           type: number
 *           description: Importe total
 *       example:
 *         project: 60d725b67be3da1254f3dba9
 *         date: 2023-06-15T00:00:00.000Z
 *         workedHours:
 *           - person: Juan Pérez
 *             hours: 8
 *             hourlyRate: 25
 *             description: Desarrollo frontend
 *         materials:
 *           - name: Módulo RAM
 *             quantity: 2
 *             price: 45
 *             description: 8GB DDR4
 *         observations: Entrega parcial del proyecto
 */


// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Crear un nuevo albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryNote'
 *     responses:
 *       201:
 *         description: Albarán creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       404:
 *         description: Proyecto no encontrado
 *       500:
 *         description: Error del servidor
 */

router.post("/", validatorCreateDeliveryNote, createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: Obtener todos los albaranes
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filtrar por proyecto
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, signed, cancelled]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de albaranes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNotes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryNote'
 *       500:
 *         description: Error del servidor
 */
router.get("/", getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Obtener PDF de un albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: PDF del albarán
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Albarán no encontrado
 *       500:
 *         description: Error del servidor
 */

router.get("/pdf/:id", validatorGetDeliveryNote, getDeliveryNotePdf);

/**
 * @swagger
 * /api/deliverynote/sign/{id}:
 *   post:
 *     summary: Firmar un albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de firma
 *               signer:
 *                 type: string
 *                 description: Nombre de quien firma
 *     responses:
 *       200:
 *         description: Albarán firmado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *                 message:
 *                   type: string
 *       400:
 *         description: No se proporcionó firma
 *       404:
 *         description: Albarán no encontrado
 *       500:
 *         description: Error del servidor
 */

router.post("/sign/:id", 
    validatorGetDeliveryNote, 
    uploadMiddlewareMemory.single("signature"),
    signDeliveryNote
);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán específico
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: Detalles del albarán
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       404:
 *         description: Albarán no encontrado
 *       500:
 *         description: Error del servidor
 */

router.get("/:id", validatorGetDeliveryNote, getDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   put:
 *     summary: Actualizar un albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryNote'
 *     responses:
 *       200:
 *         description: Albarán actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: No se puede actualizar un albarán firmado
 *       404:
 *         description: Albarán o proyecto no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put("/:id", validatorCreateDeliveryNote, updateDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Eliminar un albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *       - in: query
 *         name: hard
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Si es 'true', realiza hard delete, de lo contrario soft delete
 *     responses:
 *       200:
 *         description: Albarán eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: No se puede eliminar un albarán firmado
 *       404:
 *         description: Albarán no encontrado
 *       500:
 *         description: Error del servidor
 */

router.delete("/:id", validatorGetDeliveryNote, deleteDeliveryNote);

module.exports = router;