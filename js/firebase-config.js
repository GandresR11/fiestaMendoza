import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configuración oficial de tu proyecto Fiesta Mendoza
const firebaseConfig = {
  apiKey: "AIzaSyDkfAKpeTVtTyXxzQRbkG6C1QLXYUq1FD4",
  authDomain: "fiesta-mendoza-s.firebaseapp.com",
  databaseURL: "https://fiesta-mendoza-s-default-rtdb.firebaseio.com",
  projectId: "fiesta-mendoza-s",
  storageBucket: "fiesta-mendoza-s.firebasestorage.app",
  messagingSenderId: "450296727760",
  appId: "1:450296727760:web:eda00f638c3a8aefda36d5",
  measurementId: "G-H88LS2LVJ1"
};

// Inicialización de Firebase Realtime Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, update, remove, onValue };
