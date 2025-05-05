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

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Crear un albarán
router.post("/", validatorCreateDeliveryNote, createDeliveryNote);

// Obtener todos los albaranes
router.get("/", getDeliveryNotes);

// Obtener PDF de un albarán
router.get("/pdf/:id", validatorGetDeliveryNote, getDeliveryNotePdf);

// Firmar un albarán
router.post("/sign/:id", 
    validatorGetDeliveryNote, 
    uploadMiddlewareMemory.single("signature"),
    signDeliveryNote
);

// Obtener un albarán específico
router.get("/:id", validatorGetDeliveryNote, getDeliveryNote);

// Actualizar un albarán
router.put("/:id", validatorCreateDeliveryNote, updateDeliveryNote);

// Eliminar un albarán
router.delete("/:id", validatorGetDeliveryNote, deleteDeliveryNote);

module.exports = router;