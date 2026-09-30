/**
 * Coordinador Principal de la Aplicación SPA (Mi Ruta Admin)
 */
import { requireAuth, logout } from "./services/authService.js";
import { 
    fetchDrivers, 
    subscribeDrivers, 
    registerNewDriver 
} from "./services/driversService.js";
import { 
    fetchUsers, 
    updateUserRole 
} from "./services/usersService.js";
import { 
    fetchAlerts, 
    subscribeAlerts, 
    approveAlert, 
    removeAlert 
} from "./services/alertsService.js";
import { 
    showToast, 
    initTheme, 
    toggleTheme, 
    openModal, 
    closeModal, 
    confirmDialog, 
    updateGreeting 
} from "./utils/ui.js";
import { escapeHtml } from "./utils/sanitizers.js";
import { formatCoordinate, formatRelativeTime } from "./utils/formatters.js";

// 1. Verificación de Autenticación
const currentAdmin = requireAuth();
if (currentAdmin) {
    const badgeEl = document.getElementById("adminUserBadge");
    if (badgeEl) badgeEl.textContent = `Admin: ${currentAdmin}`;
}

// 2. Inicialización de Tema y Saludo
initTheme();
updateGreeting();

// 3. Estado Local de la Aplicación
const state = {
    currentView: 'dashboard',
    drivers: [],
    users: [],
    alerts: [],
    alertFilter: 'todas',
    userSearchQuery: '',
    unsubscribers: {
        drivers: null,
        alerts: null
    }
};

// 4. Navegación SPA
export function switchView(viewName) {
    state.currentView = viewName;

    // Actualizar vistas
    document.querySelectorAll('.admin-view').forEach(el => el.classList.remove('active'));
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    // Actualizar enlaces en sidebar
    document.querySelectorAll('.sidebar-item').forEach(btn => btn.classList.remove('active'));
    const activeNavBtn = document.getElementById(`nav-${viewName}`);
    if (activeNavBtn) activeNavBtn.classList.add('active');

    // Actualizar enlaces en barra móvil
    document.querySelectorAll('.mobile-item').forEach(btn => btn.classList.remove('active'));
    const activeMobileBtn = document.getElementById(`mobile-${viewName}`);
    if (activeMobileBtn) activeMobileBtn.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Cargar o refrescar datos específicos de vista si no están en streaming
    if (viewName === 'usuarios') {
        loadUsers();
    }
}

// 5. Gestión de Conductores
function renderDrivers(drivers) {
    state.drivers = drivers;
    const statEl = document.getElementById("statDriversCount");
    if (statEl) statEl.textContent = drivers.length;

    const container = document.getElementById("driversList");
    if (!container) return;

    if (drivers.length === 0) {
        container.innerHTML = `
            <div class="m3-inner-item p-6 text-center">
                <p class="text-xs font-semibold dark:text-miruta-textMutedDark text-slate-500">No hay unidades transmitiendo en este momento.</p>
            </div>
        `;
        return;
    }

    const itemsHtml = drivers.map(driver => {
        const safeName = escapeHtml(driver.nombre || driver.id || 'Chofer');
        const safeRoute = escapeHtml(driver.ruta || 'Sin Ruta Asignada');
        const safeLat = formatCoordinate(driver.lat);
        const safeLng = formatCoordinate(driver.lng);
        const isOnline = driver.activo !== false;

        return `
            <div class="m3-inner-item p-4 flex justify-between items-center hover:border-miruta-primary/40 transition shadow-sm group">
                <div class="flex items-center space-x-3.5">
                    <div class="w-10 h-10 rounded-xl bg-miruta-primary/15 border border-miruta-primary/30 flex items-center justify-center shrink-0">
                        <img src="bus.svg" alt="Unidad" class="w-6 h-6 object-contain shrink-0">
                    </div>
                    <div>
                        <p class="font-black text-xs group-hover:text-miruta-primary transition">${safeName}</p>
                        <p class="text-[11px] text-miruta-primary font-bold">Ruta: ${safeRoute} • ${isOnline ? 'Activo' : 'Inactivo'}</p>
                        <p class="text-[10px] dark:text-miruta-textMutedDark text-slate-500 font-mono mt-0.5">Lat: ${safeLat}, Lng: ${safeLng}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="hidden sm:inline-block text-[10px] ${isOnline ? 'bg-m3status-success/15 text-m3status-success border-m3status-success/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-white/10'} border px-2.5 py-1 rounded-full font-extrabold">
                        ${isOnline ? 'Transmitiendo GPS' : 'Desconectado'}
                    </span>
                    <span class="relative flex h-2.5 w-2.5">
                        ${isOnline ? `
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-m3status-success opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-m3status-success"></span>
                        ` : `
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                        `}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = itemsHtml;
}

export async function handleRegisterDriver(event) {
    if (event) event.preventDefault();

    const userInput = document.getElementById("modalNewDriverUser");
    const passInput = document.getElementById("modalNewDriverPass");
    const routeInput = document.getElementById("modalNewDriverRoute");
    const btnSubmit = document.getElementById("modalRegisterSubmit");

    const username = userInput?.value || "";
    const password = passInput?.value || "";
    const route = routeInput?.value || "";

    if (btnSubmit) btnSubmit.disabled = true;

    try {
        await registerNewDriver({ username, password, route });
        showToast(`¡Conductor '${username}' registrado con éxito!`, "success");
        if (userInput) userInput.value = "";
        if (passInput) passInput.value = "";
        if (routeInput) routeInput.value = "";
        closeModal("modalRegisterDriver");
        loadUsers();
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

// 6. Gestión de Usuarios y Roles
export async function loadUsers() {
    const container = document.getElementById("usersList");
    const statEl = document.getElementById("statUsersCount");

    if (container) {
        container.innerHTML = `
            <div class="flex items-center justify-center space-x-2 py-6 text-xs font-semibold dark:text-miruta-textMutedDark text-slate-500">
                <svg class="w-4 h-4 animate-spin text-miruta-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Cargando usuarios registrados...</span>
            </div>
        `;
    }

    try {
        const users = await fetchUsers();
        state.users = users;
        if (statEl) statEl.textContent = users.length;
        renderUsersList();
    } catch (err) {
        console.error("Error al cargar usuarios:", err);
        if (container) {
            container.innerHTML = `<p class="text-m3status-danger text-xs py-3 text-center font-bold">Error al cargar usuarios: ${escapeHtml(err.message)}</p>`;
        }
    }
}

function renderUsersList() {
    const container = document.getElementById("usersList");
    if (!container) return;

    let filtered = state.users;
    if (state.userSearchQuery.trim()) {
        const q = state.userSearchQuery.toLowerCase();
        filtered = filtered.filter(u => 
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.id && u.id.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="m3-inner-item p-6 text-center">
                <p class="text-xs font-semibold dark:text-miruta-textMutedDark text-slate-500">No se encontraron usuarios.</p>
            </div>
        `;
        return;
    }

    const itemsHtml = filtered.map(user => {
        const docId = escapeHtml(user.id);
        const username = escapeHtml(user.username || user.id || 'Usuario');
        const role = user.role || 'pasajero';
        const isConductor = role === 'conductor';
        const isAdmin = role === 'admin';
        const targetRole = isConductor ? 'pasajero' : 'conductor';
        const initial = username.substring(0, 2).toUpperCase();

        return `
            <div class="m3-inner-item p-4 flex justify-between items-center hover:border-miruta-primary/30 transition shadow-sm">
                <div class="flex items-center space-x-3.5">
                    <div class="w-10 h-10 rounded-xl ${
                        isAdmin ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                        isConductor ? 'bg-miruta-primary/20 text-miruta-primary border border-miruta-primary/30' : 
                        'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                    } flex items-center justify-center font-black text-xs uppercase shrink-0">
                        ${initial}
                    </div>
                    <div>
                        <p class="font-extrabold text-xs">${username}</p>
                        <span class="inline-block mt-0.5 text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                            isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            isConductor ? 'bg-miruta-primary/20 text-miruta-primary border border-miruta-primary/30' : 
                            'bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10'
                        }">
                            Rol: ${escapeHtml(role)}
                        </span>
                    </div>
                </div>
                <div>
                    ${!isAdmin ? `
                        <button onclick="window.app.handlePromoteUser('${docId}', '${targetRole}')" class="app-chip-btn">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                            <span>${isConductor ? 'Cambiar a Pasajero' : 'Asignar Conductor'}</span>
                        </button>
                    ` : `
                        <span class="text-[10px] font-black uppercase text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10">Superadmin</span>
                    `}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = itemsHtml;
}

export async function handlePromoteUser(userId, newRole) {
    try {
        await updateUserRole(userId, newRole);
        showToast(`Rol de '${userId}' actualizado a '${newRole}' con éxito.`, "success");
        loadUsers();
    } catch (err) {
        showToast(`Error al cambiar rol: ${err.message}`, "error");
    }
}

// 7. Moderación de Alertas e Incidencias
export function filterAlerts(mode) {
    state.alertFilter = mode;
    document.querySelectorAll('[id^="filter-"]').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`filter-${mode}`);
    if (activeBtn) activeBtn.classList.add('active');
    renderAlertsList();
}

function updateAlertCounters() {
    const total = state.alerts.length;
    const globales = state.alerts.filter(a => a.esGlobal === true).length;
    const pendientes = state.alerts.filter(a => a.esGlobal !== true).length;

    const statEl = document.getElementById("statAlertsCount");
    if (statEl) statEl.textContent = total;

    const lblTodas = document.getElementById('filter-label-todas');
    const lblGlobales = document.getElementById('filter-label-globales');
    const lblPendientes = document.getElementById('filter-label-pendientes');

    if (lblTodas) lblTodas.textContent = `✓ Todas (${total})`;
    if (lblGlobales) lblGlobales.textContent = `Globales (${globales})`;
    if (lblPendientes) lblPendientes.textContent = `Pendientes (${pendientes})`;
}

function renderAlertsList() {
    updateAlertCounters();
    const container = document.getElementById("alertsList");
    if (!container) return;

    let filtered = state.alerts;
    if (state.alertFilter === 'globales') {
        filtered = filtered.filter(a => a.esGlobal === true);
    } else if (state.alertFilter === 'pendientes') {
        filtered = filtered.filter(a => a.esGlobal !== true);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="m3-inner-item p-6 text-center">
                <svg class="w-8 h-8 text-m3status-success/70 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-xs font-extrabold">¡Sin incidencias en esta categoría!</p>
                <p class="text-[11px] dark:text-miruta-textMutedDark text-slate-500 font-medium mt-0.5">El servicio opera con normalidad.</p>
            </div>
        `;
        return;
    }

    const itemsHtml = filtered.map(item => {
        const isGlobal = item.esGlobal === true;
        const safeId = escapeHtml(item.id);
        const safeType = escapeHtml(item.tipo || 'Alerta');
        const safeTitle = escapeHtml(item.titulo || 'Reporte de incidencia');
        const safeDesc = escapeHtml(item.descripcion || 'Sin detalle adicional');
        const safeConfirmations = Number(item.confirmaciones || 1);
        const timeAgo = formatRelativeTime(item.timestamp || item.updatedAt || item.fecha);

        return `
            <div class="m3-inner-item p-4 space-y-3 hover:border-miruta-primary/30 transition shadow-sm">
                <div class="flex justify-between items-start gap-2">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-block text-[10px] bg-red-500/15 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                                ${safeType}
                            </span>
                            <span class="text-[10px] text-slate-400 font-semibold">• ${timeAgo}</span>
                        </div>
                        <h4 class="font-extrabold text-xs">${safeTitle}</h4>
                    </div>
                    <span class="shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center space-x-1 ${
                        isGlobal ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : 'bg-miruta-primary/15 text-miruta-primary border-miruta-primary/30'
                    }">
                        <span class="w-1.5 h-1.5 rounded-full ${isGlobal ? 'bg-emerald-500' : 'bg-miruta-primary'} inline-block"></span>
                        <span>${isGlobal ? 'Global' : 'Pendiente'} (${safeConfirmations})</span>
                    </span>
                </div>

                <p class="text-xs font-medium dark:text-slate-300 text-slate-700 leading-relaxed">${safeDesc}</p>

                <div class="flex justify-end space-x-2 pt-2 border-t dark:border-white/10 border-slate-200">
                    ${!isGlobal ? `
                        <button onclick="window.app.handleApproveAlert('${safeId}')" class="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl font-extrabold transition flex items-center space-x-1.5 cursor-pointer">
                            <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            <span>Aprobar Global</span>
                        </button>
                    ` : ''}
                    <button onclick="window.app.handleDeleteAlert('${safeId}')" class="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-300 border border-red-500/30 px-3.5 py-2 rounded-xl font-extrabold transition flex items-center space-x-1.5 cursor-pointer">
                        <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = itemsHtml;
}

export async function handleApproveAlert(alertId) {
    try {
        await approveAlert(alertId);
        showToast("¡Alerta promovida a Global con éxito!", "success");
    } catch (err) {
        showToast(`Error al aprobar alerta: ${err.message}`, "error");
    }
}

export async function handleDeleteAlert(alertId) {
    const confirmed = await confirmDialog({
        title: "Eliminar Incidencia",
        message: "¿Estás seguro de que deseas eliminar permanentemente esta alerta comunitaria?",
        confirmText: "Eliminar",
        confirmType: "danger"
    });

    if (!confirmed) return;

    try {
        await removeAlert(alertId);
        showToast("Alerta eliminada correctamente.", "info");
    } catch (err) {
        showToast(`Error al eliminar alerta: ${err.message}`, "error");
    }
}

// 8. Inicialización de Listeners y Suscripciones en Vivo
export function initSubscriptions() {
    // Suscripción en vivo a Conductores (GPS Telemetry)
    state.unsubscribers.drivers = subscribeDrivers(
        (drivers) => renderDrivers(drivers),
        (err) => showToast(`Error en conexión GPS: ${err.message}`, "error")
    );

    // Suscripción en vivo a Alertas Comunitarias
    state.unsubscribers.alerts = subscribeAlerts(
        (alerts) => {
            state.alerts = alerts;
            renderAlertsList();
        },
        (err) => showToast(`Error en incidencias: ${err.message}`, "error")
    );
}

export function refreshAll() {
    loadUsers();
    showToast("Datos sincronizados con Firestore.", "info");
}

// 9. Vincular buscador de usuarios
const userSearchInput = document.getElementById("userSearchInput");
if (userSearchInput) {
    userSearchInput.addEventListener("input", (e) => {
        state.userSearchQuery = e.target.value;
        renderUsersList();
    });
}

// 10. Exponer funciones al entorno global para los atributos onclick de HTML
window.app = {
    switchView,
    toggleTheme,
    logout,
    refreshAll,
    openModal,
    closeModal,
    handleRegisterDriver,
    handlePromoteUser,
    filterAlerts,
    handleApproveAlert,
    handleDeleteAlert,
    loadUsers
};

// Iniciar suscripciones y carga inicial
initSubscriptions();
loadUsers();
