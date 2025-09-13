// utils/generateUniqueId.js
function generateUniqueId(role = "USER") {
  const prefix = role.toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${prefix}-${random}`;
}

module.exports = generateUniqueId;
