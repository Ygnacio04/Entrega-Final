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

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Crear un proyecto
router.post("/", validatorCreateProject, createProject);

// Obtener todos los proyectos
router.get("/", getProjects);

// Obtener proyectos archivados
router.get("/archived", getArchivedProjects);

// Restaurar un proyecto archivado
router.put("/restore/:id", validatorGetProject, restoreProject);

// Obtener un proyecto específico
router.get("/:id", validatorGetProject, getProject);

// Actualizar un proyecto
router.put("/:id", validatorCreateProject, updateProject);

// Eliminar un proyecto (soft o hard delete)
router.delete("/:id", validatorGetProject, deleteProject);

module.exports = router;