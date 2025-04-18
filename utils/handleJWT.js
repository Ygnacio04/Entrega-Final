const jwt = require("jsonwebtoken");

// Firmar un nuevo JWT con el payload del usuario
const tokenSign = async (user) => {
  const payload = {
    _id: user._id,
    role: user.role,
    email: user.email,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
  return token;
};

// Verificar un JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error("Error al verificar token:", error);
    return null;
  }
};

module.exports = { tokenSign, verifyToken };