// ================================================================
//  firebase-config.js
//  ⚠️  ÚNICO ARCHIVO QUE DEBES EDITAR CON TUS DATOS DE FIREBASE
//  Iglesia Luz y Vida IV — Sistema de Asistencia
// ================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 👇 PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE (ver GUIA.md paso 2)
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
