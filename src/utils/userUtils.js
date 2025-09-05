// Utilità per gli utenti
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username) => {
  // Username deve essere almeno 3 caratteri, solo lettere, numeri, punto e underscore
  const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password) => {
  // Password deve essere almeno 4 caratteri
  return password && password.length >= 4;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT');
};
