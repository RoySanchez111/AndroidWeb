/**
 * Utilidades para sanitización y prevención de inyección XSS
 */

/**
 * Escapa caracteres peligrosos en cadenas de texto para renderizar de forma segura en HTML
 * @param {unknown} value - Valor a sanitizar
 * @returns {string} - Cadena de texto segura
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
}
