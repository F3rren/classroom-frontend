import { useState } from "react";
import { validateEmail, validateUsername, validatePassword } from "../../utils/userUtils";

export default function UserModal({ user, isEditing, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    nome: user?.nome || "",
    email: user?.email || "",
    password: "",
    ruolo: user?.ruolo || "user"
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Funzione di validazione migliorata
  const validateField = (field, value) => {
    switch (field) {
      case 'username':
        if (!value) return "Username è obbligatorio";
        if (!validateUsername(value)) {
          return "Username deve essere 3-20 caratteri (lettere, numeri, . e _)";
        }
        break;
      case 'nome':
        if (!value || value.trim().length < 2) {
          return "Nome deve essere almeno 2 caratteri";
        }
        break;
      case 'email':
        if (!value) return "Email è obbligatoria";
        if (!validateEmail(value)) {
          return "Email non valida";
        }
        break;
      case 'password':
        if (!isEditing && !value) {
          return "Password è obbligatoria per nuovi utenti";
        } else if (value && !validatePassword(value)) {
          return "Password deve essere almeno 4 caratteri";
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const validate = () => {
    const newErrors = {};
    
    // Valida tutti i campi
    ['username', 'nome', 'email', 'password'].forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validazione in tempo reale per migliorare UX
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Rimuovi l'errore del campo se presente
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const userData = {
        username: formData.username.trim(),
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        ruolo: formData.ruolo
      };
      
      // Per modifiche, includi l'ID e dati esistenti
      if (isEditing && user?.id) {
        userData.id = user.id;
        userData.password = user.password; // Mantieni la password esistente se non modificata
        userData.dataRegistrazione = user.dataRegistrazione;
        userData.ultimoAccesso = user.ultimoAccesso;
      }
      
      // Includi password solo se è stata inserita
      if (formData.password) {
        userData.password = formData.password;
      }
      
      await onSave(userData, isEditing);
    } catch {
      // Gli errori sono gestiti dal componente padre
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {isEditing ? "Modifica Utente" : "Nuovo Utente"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.username 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="mario.rossi"
              disabled={isSubmitting}
            />
            {errors.username && (
              <p className="text-red-600 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.nome 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Mario Rossi"
              disabled={isSubmitting}
            />
            {errors.nome && (
              <p className="text-red-600 text-sm mt-1">{errors.nome}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.email 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="mario.rossi@example.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password {isEditing ? "(lascia vuoto per non modificare)" : "*"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 transition-colors ${
                  errors.password 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder={isEditing ? "Nuova password..." : "Password..."}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                tabIndex="-1"
              >
                {showPassword ? "�" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ruolo
            </label>
            <select
              value={formData.ruolo}
              onChange={(e) => handleInputChange('ruolo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="user">Utente</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting 
                ? (isEditing ? 'Salvando...' : 'Creando...') 
                : (isEditing ? 'Salva Modifiche' : 'Crea Utente')
              }
            </button>
          </div>
        </form>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
