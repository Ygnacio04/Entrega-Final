const express = require("express");
const router = express.Router();
const { validatorCreateClient, validatorGetClient } = require("../validators/clients");
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

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Crear un cliente
router.post("/", validatorCreateClient, createClient);

// Obtener todos los clientes
router.get("/", getClients);

// Obtener clientes archivados
router.get("/archived", getArchivedClients);

// Restaurar un cliente archivado
router.put("/restore/:id", validatorGetClient, restoreClient);

// Obtener un cliente específico
router.get("/:id", validatorGetClient, getClient);

// Actualizar un cliente
router.put("/:id", validatorCreateClient, updateClient);

// Actualizar parcialmente un cliente
router.patch("/:id", validatorCreateClient, updateClient);

// Eliminar un cliente (soft o hard delete)
router.delete("/:id", validatorGetClient, deleteClient);

module.exports = router;