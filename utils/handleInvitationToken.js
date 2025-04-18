const jwt = require("jsonwebtoken");

const generateInvitationToken = (userId, companyId) => {
  const payload = {
    userId,
    companyId,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
  return token;
};

const verifyInvitationToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return decoded;
  } catch (error) {
    throw new Error("Token de invitación inválido o expirado.");
  }
};

module.exports = { generateInvitationToken, verifyInvitationToken };
