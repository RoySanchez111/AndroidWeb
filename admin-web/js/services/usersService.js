/**
 * Servicio para consulta y administración de Usuarios y Roles
 */
import { db } from "../config/firebase.js";
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    setDoc,
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const COLLECTION_NAME = "users";

/**
 * Obtiene todos los usuarios registrados
 * @returns {Promise<Array<object>>}
 */
export async function fetchUsers() {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const users = [];
    snapshot.forEach(docSnap => {
        users.push({ id: docSnap.id, ...docSnap.data() });
    });
    return users;
}

/**
 * Actualiza el rol de un usuario y sincroniza con la colección de conductores
 * @param {string} userId - ID o username del documento
 * @param {'pasajero'|'conductor'|'admin'} newRole - Nuevo rol asignado
 * @returns {Promise<{success: boolean}>}
 */
export async function updateUserRole(userId, newRole) {
    if (!userId || !newRole) {
        throw new Error("Parámetros de usuario y rol inválidos.");
    }

    const userDocRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(userDocRef, {
        role: newRole,
        updatedAt: Date.now()
    });

    // Sincronización con la colección 'conductores'
    const conductorDocRef = doc(db, "conductores", userId);
    if (newRole === "conductor") {
        await setDoc(conductorDocRef, {
            id: userId,
            nombre: userId,
            ruta: "Línea Principal",
            lat: 18.9994,
            lng: -98.2618,
            activo: true,
            updatedAt: Date.now()
        }, { merge: true });
    } else {
        // Si el usuario pasa a ser pasajero, se desactiva o elimina de la lista de unidades activas
        try {
            await deleteDoc(conductorDocRef);
        } catch {
            // Ignorar si no existía el documento en conductores
        }
    }

    return { success: true };
}
