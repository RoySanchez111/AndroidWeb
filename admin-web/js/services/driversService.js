/**
 * Servicio para gestión y monitoreo en tiempo real de Conductores y Unidades GPS
 */
import { db } from "../config/firebase.js";
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const COLLECTION_NAME = "conductores";
const USERS_COLLECTION = "users";

/**
 * Obtiene todas las unidades de conductores de una sola vez
 * @returns {Promise<Array<object>>}
 */
export async function fetchDrivers() {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const drivers = [];
    snapshot.forEach(docSnap => {
        drivers.push({ id: docSnap.id, ...docSnap.data() });
    });
    return drivers;
}

/**
 * Se suscribe en tiempo real a las unidades transmitiendo telemetría
 * @param {(drivers: Array<object>) => void} onUpdate - Callback con la lista actualizada
 * @param {(error: Error) => void} onError - Callback ante errores
 * @returns {() => void} Función para desuscribirse
 */
export function subscribeDrivers(onUpdate, onError) {
    return onSnapshot(
        collection(db, COLLECTION_NAME),
        (snapshot) => {
            const drivers = [];
            snapshot.forEach(docSnap => {
                drivers.push({ id: docSnap.id, ...docSnap.data() });
            });
            onUpdate(drivers);
        },
        (error) => {
            console.error("Error en suscripción de conductores:", error);
            if (onError) onError(error);
        }
    );
}

/**
 * Registra y da de alta un nuevo conductor en 'users' y 'conductores'
 * @param {object} params
 * @param {string} params.username
 * @param {string} params.password
 * @param {string} params.route
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function registerNewDriver({ username, password, route }) {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanRoute = route.trim();

    if (!cleanUser || !cleanPass || !cleanRoute) {
        throw new Error("Todos los campos (usuario, contraseña y ruta) son obligatorios.");
    }

    if (cleanUser.length < 3) {
        throw new Error("El nombre de usuario debe tener al menos 3 caracteres.");
    }

    // Verificar si el usuario ya existe en Firestore
    const userDocRef = doc(db, USERS_COLLECTION, cleanUser);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        const existingData = userDocSnap.data();
        if (existingData.role === "conductor") {
            throw new Error(`El usuario '${cleanUser}' ya está registrado como conductor.`);
        }
    }

    const now = Date.now();

    // 1. Crear o actualizar en colección 'users'
    await setDoc(userDocRef, {
        username: cleanUser,
        role: "conductor",
        tempPassword: cleanPass,
        updatedAt: now
    }, { merge: true });

    // 2. Crear entrada en colección 'conductores'
    const conductorDocRef = doc(db, COLLECTION_NAME, cleanUser);
    await setDoc(conductorDocRef, {
        id: cleanUser,
        nombre: cleanUser,
        ruta: cleanRoute,
        lat: 18.9994,
        lng: -98.2618,
        activo: true,
        updatedAt: now
    });

    return { success: true };
}
