/**
 * Configuración centralizada e inicialización de Firebase SDK (Firestore)
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const firebaseConfig = {
    projectId: "appmiruta-16530",
    apiKey: "AIzaSyBDstlojmjLfxCGWYIAS4eFL9kOJKCeyY4",
    appId: "1:233432719012:web:your_web_app_id_here"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
