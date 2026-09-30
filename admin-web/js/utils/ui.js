/**
 * Componentes y utilidades de interfaz de usuario (M3)
 */

/**
 * Muestra notificación Toast accesible y animada
 * @param {string} message - Texto del mensaje
 * @param {'success'|'error'|'info'|'warning'} type - Tipo de notificación
 * @param {number} duration - Duración en milisegundos
 */
export function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border transition-all duration-300 transform translate-y-2 opacity-0 text-xs font-bold backdrop-blur-md';

    let iconSvg = '';
    if (type === 'success') {
        toast.classList.add('bg-emerald-900/90', 'border-emerald-500/40', 'text-emerald-100');
        iconSvg = `<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
    } else if (type === 'error') {
        toast.classList.add('bg-red-900/90', 'border-red-500/40', 'text-red-100');
        iconSvg = `<svg class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`;
    } else if (type === 'warning') {
        toast.classList.add('bg-amber-900/90', 'border-amber-500/40', 'text-amber-100');
        iconSvg = `<svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
    } else {
        toast.classList.add('bg-slate-900/90', 'border-yellow-500/40', 'text-slate-100');
        iconSvg = `<svg class="w-4 h-4 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }

    toast.innerHTML = `<div class="shrink-0">${iconSvg}</div><div class="flex-1">${message}</div>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Control del tema (Claro / Oscuro) con persistencia en localStorage
 */
export function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    if (isDark) {
        html.classList.remove('dark');
        html.classList.add('light');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.remove('light');
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

export function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }
}

/**
 * Manejo accesible de Modales
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Enfocar primer input si existe
    const firstInput = modal.querySelector('input:not([disabled]), button:not([disabled])');
    if (firstInput) firstInput.focus();
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Cerrar modales con tecla Escape
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const visibleModals = document.querySelectorAll('.fixed:not(.hidden)[id^="modal"]');
        visibleModals.forEach(m => closeModal(m.id));
    }
});

/**
 * Diálogo de confirmación M3 asíncrono estilizado (reemplaza confirm() nativo del navegador)
 * @param {object} options
 * @param {string} options.title - Título del diálogo
 * @param {string} options.message - Mensaje explicativo
 * @param {string} options.confirmText - Texto del botón de confirmación
 * @param {'danger'|'primary'} options.confirmType - Tipo visual de la acción
 * @returns {Promise<boolean>}
 */
export function confirmDialog({
    title = '¿Confirmar acción?',
    message = '¿Estás seguro de que deseas continuar?',
    confirmText = 'Confirmar',
    confirmType = 'danger'
} = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalConfirmDialog');
        if (!modal) {
            // Fallback en caso de que el elemento no esté en el DOM
            resolve(window.confirm(`${title}\n\n${message}`));
            return;
        }

        const titleEl = document.getElementById('modalConfirmTitle');
        const messageEl = document.getElementById('modalConfirmMessage');
        const btnConfirm = document.getElementById('modalConfirmAccept');
        const btnCancel = document.getElementById('modalConfirmCancel');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        if (btnConfirm) {
            btnConfirm.textContent = confirmText;
            btnConfirm.className = confirmType === 'danger'
                ? 'flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2.5 rounded-xl text-xs transition cursor-pointer'
                : 'flex-1 bg-miruta-primary hover:bg-miruta-primaryHover text-miruta-textLight font-black py-2.5 rounded-xl text-xs transition cursor-pointer';
        }

        const cleanup = (result) => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            btnConfirm?.removeEventListener('click', onConfirm);
            btnCancel?.removeEventListener('click', onCancel);
            resolve(result);
        };

        const onConfirm = () => cleanup(true);
        const onCancel = () => cleanup(false);

        btnConfirm?.addEventListener('click', onConfirm);
        btnCancel?.addEventListener('click', onCancel);

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
}

/**
 * Actualiza el saludo dinámico según la hora local
 */
export function updateGreeting(elementId = 'greetingText') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
        el.textContent = 'Buenos días';
    } else if (hour >= 12 && hour < 19) {
        el.textContent = 'Buenas tardes';
    } else {
        el.textContent = 'Buenas noches';
    }
}
