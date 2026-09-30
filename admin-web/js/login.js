/**
 * Controlador de la página de Login
 */
import { initTheme } from "./utils/ui.js";
import { getCurrentAdmin, authenticateAdmin } from "./services/authService.js";

// Inicializar tema guardado
initTheme();

// Si ya tiene sesión activa, redirigir al panel principal
if (getCurrentAdmin()) {
    window.location.href = "index.html";
}

const loginForm = document.getElementById("loginForm");
const userInput = document.getElementById("loginUsername");
const passInput = document.getElementById("loginPassword");
const errorBanner = document.getElementById("errorBanner");
const errorMessage = document.getElementById("errorMessage");
const btnSubmit = document.getElementById("btnLoginSubmit");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");

function setLoading(isLoading) {
    if (!btnSubmit) return;
    btnSubmit.disabled = isLoading;
    if (isLoading) {
        btnText.textContent = "Verificando...";
        btnSpinner?.classList.remove("hidden");
        errorBanner?.classList.add("hidden");
    } else {
        btnText.textContent = "Iniciar Sesión";
        btnSpinner?.classList.add("hidden");
    }
}

function showError(msg) {
    if (errorMessage) errorMessage.textContent = msg;
    if (errorBanner) errorBanner.classList.remove("hidden");
}

loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = userInput?.value || "";
    const pass = passInput?.value || "";

    setLoading(true);

    try {
        const result = await authenticateAdmin(user, pass);
        if (result.success) {
            window.location.href = "index.html";
        } else {
            showError(result.message || "Credenciales inválidas.");
        }
    } catch (err) {
        showError(`Ocurrió un error inesperado: ${err.message}`);
    } finally {
        setLoading(false);
    }
});
