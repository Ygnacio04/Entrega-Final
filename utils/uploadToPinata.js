const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");

const pinataApiKey = process.env.PINATA_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET;

/**
 * Sube un archivo a Pinata IPFS
 * @param {Object} file - Objeto con buffer y nombre del archivo
 * @param {String} fileName - Nombre del archivo
 * @returns {Promise<Object>} - Respuesta de Pinata con el hash IPFS
 */
async function uploadToPinata(file, fileName) {
    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        // Crear un archivo temporal para almacenar el buffer
        const tempFilePath = path.join(os.tmpdir(), fileName);
        
        // Escribir el buffer en el archivo temporal
        fs.writeFileSync(tempFilePath, file.buffer);
        
        // Crear el FormData para la petición
        const formData = new FormData();
        
        // Agregar el archivo al FormData desde el archivo temporal
        formData.append('file', fs.createReadStream(tempFilePath), fileName);
        
        // Agregar los metadatos
        const metadata = JSON.stringify({
            name: fileName
        });
        formData.append('pinataMetadata', metadata);
        
        const options = JSON.stringify({
            cidVersion: 0,
        });
        formData.append('pinataOptions', options);
        
        // Enviar la petición a Pinata
        const response = await fetch(url, {
            
            method: 'POST',
            body: formData,
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        });
        const responseData = response.json();
        return responseData;
    } catch (error) {
        console.error('Error al subir archivo a Pinata:', error);
        
        // Si hay un error, asegurarse de limpiar archivos temporales si existen
        try {
            const tempFilePath = path.join(os.tmpdir(), fileName);
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        } catch (cleanupError) {
            console.error('Error al limpiar archivos temporales:', cleanupError);
        }
        
        throw error;
    }
}

module.exports = uploadToPinata;