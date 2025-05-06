// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkn0SMPvYAw2eWmCUp2rCf3Y4FFpVxCBI",
  authDomain: "meine-eigene-spiel-webseite.firebaseapp.com",
  projectId: "meine-eigene-spiel-webseite",
  storageBucket: "meine-eigene-spiel-webseite.firebasestorage.app",
  messagingSenderId: "825319937465",
  appId: "1:825319937465:web:b53b568f9bb65f0d639268",
  measurementId: "G-XZ5FQC3Z2E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };