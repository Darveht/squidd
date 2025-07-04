
// Configuración de Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, get, onValue, remove, push, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyCFQ_geG0HIv2EZ-bfKc97TJNtf2sdqPzc",
    authDomain: "clack-koder.firebaseapp.com",
    databaseURL: "https://clack-koder-default-rtdb.firebaseio.com",
    projectId: "clack-koder",
    storageBucket: "clack-koder.firebasestorage.app",
    messagingSenderId: "478151254938",
    appId: "1:478151254938:web:e2c00e3a5426bd192b9023",
    measurementId: "G-P29ME5Z3S1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, onValue, remove, push, serverTimestamp };
