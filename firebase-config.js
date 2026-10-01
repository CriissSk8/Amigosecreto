// Configuración de Firebase
// INSTRUCCIONES: Reemplaza estos valores con los de tu proyecto Firebase

const firebaseConfig = {
  apiKey: "AIzaSyBrRPxNCWTPQWEkn97RItmkbiLpR10zws8",
  authDomain: "amigosecreto-3e2cb.firebaseapp.com",
  databaseURL: "https://amigosecreto-3e2cb-default-rtdb.firebaseio.com",
  projectId: "amigosecreto-3e2cb",
  storageBucket: "amigosecreto-3e2cb.firebasestorage.app",
  messagingSenderId: "522253903391",
  appId: "1:522253903391:web:8bbed6c2cf966d299f972a",
  measurementId: "G-HVSCNVR0DV"
};


// ⚠️ DESPUÉS DE CONFIGURAR:
// 1. Ve a Firebase Console > Realtime Database
// 2. Haz clic en "Create Database"
// 3. Selecciona "Start in test mode" (para empezar)
// 4. ¡Listo! Ya funciona para todos los usuarios

// NO TOQUES NADA DE AQUÍ PARA ABAJO:
// =================================

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Realtime Database
const database = firebase.database();

// Función para verificar si Firebase está configurado
function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "TU-API-KEY-AQUI";
}

// Mostrar instrucciones si no está configurado
if (!isFirebaseConfigured()) {
    console.warn("🔥 FIREBASE NO CONFIGURADO");
    console.warn("Por favor sigue las instrucciones en firebase-config.js");
}