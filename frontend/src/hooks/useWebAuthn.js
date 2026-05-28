import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { API_BASE_URL } from '../apiConfig';

export const useWebAuthn = () => {
  const registerBiometric = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Debes estar logueado para activar biométricos');

      // 1. Obtener opciones del servidor
      const optionsRes = await fetch(`${API_BASE_URL}/auth/webauthn/register-options`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!optionsRes.ok) throw new Error('No se pudieron obtener las opciones de registro');
      const options = await optionsRes.json();

      // 2. Ejecutar el flujo en el navegador (Huella / FaceID)
      const credential = await startRegistration({ optionsJSON: options });

      // 3. Enviar la credencial al servidor para verificar y guardar
      const verifyRes = await fetch(`${API_BASE_URL}/auth/webauthn/register-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(credential),
      });

      if (verifyRes.ok) {
        return { success: true, message: '¡Biométricos activados correctamente!' };
      } else {
        const error = await verifyRes.json();
        throw new Error(error.message || 'Fallo la verificación de biométricos');
      }
    } catch (err) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        throw new Error('Operación cancelada o rechazada por el usuario.');
      }
      throw err;
    }
  };

  const loginWithBiometric = async (email) => {
    try {
      if (!email) throw new Error('El correo electrónico es requerido para usar biométricos');

      // 1. Obtener opciones de login del servidor
      const optionsRes = await fetch(`${API_BASE_URL}/auth/webauthn/login-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.message || 'El usuario no tiene biométricos activados.');
      }
      const options = await optionsRes.json();

      // 2. Ejecutar autenticación en el navegador
      const assertion = await startAuthentication({ optionsJSON: options });

      // 3. Enviar respuesta al servidor para obtener el JWT
      const verifyRes = await fetch(`${API_BASE_URL}/auth/webauthn/login-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, response: assertion }),
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        // Guardar sesión igual que el login normal
        localStorage.setItem("token",       data.access_token);
        localStorage.setItem("role",        data.role);
        localStorage.setItem("userId",      data.userId    || "");
        localStorage.setItem("userName",    data.nombre    || "");
        localStorage.setItem("userEmail",   email          || "");
        localStorage.setItem("userPicture", data.picture   || "");
        
        return { success: true, role: data.role };
      } else {
        const error = await verifyRes.json();
        throw new Error(error.message || 'Fallo la autenticación biométrica');
      }
    } catch (err) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        throw new Error('Operación cancelada o rechazada por el usuario.');
      }
      throw err;
    }
  };

  return { registerBiometric, loginWithBiometric };
};
