/**
 * Formateadores de fecha, números y texto para la interfaz
 */

/**
 * Formatea un número de coordenada geográfica a 4 decimales
 * @param {number|string|null|undefined} coord 
 * @param {string} fallback 
 * @returns {string}
 */
export function formatCoordinate(coord, fallback = '0.0000') {
    const num = Number(coord);
    return isNaN(num) ? fallback : num.toFixed(4);
}

/**
 * Formatea timestamp numérico o Firestore Timestamp a formato legible local
 * @param {number|object} timestamp 
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Reciente';
    let millis = 0;
    if (typeof timestamp === 'number') {
        millis = timestamp;
    } else if (timestamp && typeof timestamp.toMillis === 'function') {
        millis = timestamp.toMillis();
    } else if (timestamp.seconds) {
        millis = timestamp.seconds * 1000;
    }

    if (!millis) return 'Reciente';

    const diff = Date.now() - millis;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return new Date(millis).toLocaleDateString();
}
