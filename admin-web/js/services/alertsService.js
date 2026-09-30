/**
 * Servicio para moderación de incidencias y alertas comunitarias
 */
import { db } from "../config/firebase.js";
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const COLLECTION_NAME = "incidencias";

/**
 * Obtiene todas las incidencias registradas
 * @returns {Promise<Array<object>>}
 */
export async function fetchAlerts() {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const alerts = [];
    snapshot.forEach(docSnap => {
        alerts.push({ id: docSnap.id, ...docSnap.data() });
    });
    return alerts;
}

/**
 * Se suscribe en tiempo real a las incidencias emitidas por pasajeros
 * @param {(alerts: Array<object>) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @returns {() => void}
 */
export function subscribeAlerts(onUpdate, onError) {
    return onSnapshot(
        collection(db, COLLECTION_NAME),
        (snapshot) => {
            const alerts = [];
            snapshot.forEach(docSnap => {
                alerts.push({ id: docSnap.id, ...docSnap.data() });
            });
            onUpdate(alerts);
        },
        (error) => {
            console.error("Error en suscripción de alertas:", error);
            if (onError) onError(error);
        }
    );
}

/**
 * Aprueba una alerta haciéndola global para toda la red
 * @param {string} alertId
 * @returns {Promise<{success: boolean}>}
 */
export async function approveAlert(alertId) {
    if (!alertId) throw new Error("ID de alerta requerido.");
    const alertRef = doc(db, COLLECTION_NAME, alertId);
    await updateDoc(alertRef, {
        esGlobal: true,
        aprobadaEn: Date.now()
    });
    return { success: true };
}

/**
 * Elimina una alerta del sistema
 * @param {string} alertId
 * @returns {Promise<{success: boolean}>}
 */
export async function removeAlert(alertId) {
    if (!alertId) throw new Error("ID de alerta requerido.");
    const alertRef = doc(db, COLLECTION_NAME, alertId);
    await deleteDoc(alertRef);
    return { success: true };
}
