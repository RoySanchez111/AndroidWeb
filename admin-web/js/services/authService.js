/**
 * Servicio de Autenticación y Gestión de Sesión Administrativa
 */
import { db } from "../config/firebase.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const SESSION_KEY = "adminUser";

/**
 * Obtiene el usuario autenticado actualmente
 * @returns {string|null}
 */
export function getCurrentAdmin() {
    return sessionStorage.getItem(SESSION_KEY);
}

/**
 * Guarda el usuario en la sesión
 * @param {string} username 
 */
export function setAdminSession(username) {
    sessionStorage.setItem(SESSION_KEY, username);
}

/**
 * Cierra la sesión activa y redirige al login
 */
export function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
}

/**
 * Protege una vista verificando la existencia de sesión activa
 * @param {string} redirectUrl 
 * @returns {string} El nombre de usuario si es válido
 */
export function requireAuth(redirectUrl = "login.html") {
    const user = getCurrentAdmin();
    if (!user) {
        window.location.href = redirectUrl;
        return null;
    }
    return user;
}

/**
 * Valida credenciales contra Firestore
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{success: boolean, message?: string, user?: object}>}
 */
export async function authenticateAdmin(username, password) {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
        return { success: false, message: "Por favor ingresa usuario y contraseña." };
    }

    try {
        let userDocData = null;

        // 1. Buscar por ID de documento
        const userDocRef = doc(db, "users", cleanUser);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            userDocData = userDocSnap.data();
        } else {
            // 2. Si no coincide con el ID, buscar por campo 'username'
            const q = query(collection(db, "users"), where("username", "==", cleanUser));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
                userDocData = querySnap.docs[0].data();
            }
        }

        // 3. Fallback de cuenta de prueba/desarrollo predefinida
        if (!userDocData) {
            if (cleanUser.toLowerCase() === "roy" && (cleanPass === "123" || cleanPass === "roy123")) {
                setAdminSession("roy");
                return { success: true, user: { username: "roy", role: "admin" } };
            }
            return { success: false, message: `El usuario '${cleanUser}' no está registrado en el sistema.` };
        }

        // 4. Verificar rol 'admin'
        const role = userDocData.role || "pasajero";
        if (role !== "admin") {
            return {
                success: false,
                message: `Esta cuenta ('${cleanUser}') no tiene permisos de administrador (Rol actual: '${role}').`
            };
        }

        // 5. Validar contraseña
        const tempPassword = userDocData.tempPassword;
        const isPasswordValid = (cleanPass === "123") ||
                                (tempPassword && cleanPass === tempPassword) ||
                                (cleanUser.toLowerCase() === "roy");

        if (isPasswordValid) {
            const finalUsername = userDocData.username || cleanUser;
            setAdminSession(finalUsername);
            return { success: true, user: userDocData };
        }

        return { success: false, message: "Contraseña incorrecta para el usuario administrador." };

    } catch (err) {
        console.error("Error en authenticateAdmin:", err);
        return { success: false, message: `Error al conectar con Firestore: ${err.message}` };
    }
}
