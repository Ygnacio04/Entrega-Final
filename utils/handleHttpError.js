// Función para manejar errores HTTP y enviar respuestas con el código adecuado
const handleHttpError = (res, message, code = 500) => {
    const statusCode = code || 500;
    res.status(statusCode).send({
      success: false,
      message,
      code: statusCode,
    });
  };
  
  module.exports = { handleHttpError };
  