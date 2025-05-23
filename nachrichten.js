// nachrichten.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// Firebase-Konfiguration (deine echten Werte hier eingetragen)
const firebaseConfig = {
  apiKey: "AIzaSyAkn0SMPvYAw2eWmCUp2rCf3Y4FFpVxCBI",
  authDomain: "meine-eigene-spiel-webseite.firebaseapp.com",
  projectId: "meine-eigene-spiel-webseite",
  storageBucket: "meine-eigene-spiel-webseite.firebasestorage.app",
  messagingSenderId: "825319937465",
  appId: "1:825319937465:web:b53b568f9bb65f0d639268",
  measurementId: "G-XZ5FQC3Z2E"
};

// Initialisierung
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Formular & Posteingang
const form = document.getElementById('messageForm');
const recipientInput = document.getElementById('recipient');
const messageInput = document.getElementById('message');
const inbox = document.getElementById('inbox');

onAuthStateChanged(auth, user => {
  if (!user) return;

  const userEmail = user.email;

  // Nachrichten absenden
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipient = recipientInput.value.trim();
    const text = messageInput.value.trim();

    if (!recipient || !text) return;

    try {
      await addDoc(collection(db, 'nachrichten'), {
        sender: userEmail,
        recipient: recipient,
        message: text,
        timestamp: new Date()
      });
      messageInput.value = '';
    } catch (err) {
      console.error('Fehler beim Senden:', err);
    }
  });

  // Posteingang abonnieren
  const q = query(
    collection(db, 'nachrichten'),
    where('recipient', '==', userEmail),
    orderBy('timestamp', 'desc')
  );

  onSnapshot(q, (snapshot) => {
    inbox.innerHTML = '';
    snapshot.forEach(doc => {
      const msg = doc.data();
      const li = document.createElement('li');
      li.textContent = `Von ${msg.sender}: ${msg.message}`;
      inbox.appendChild(li);
    });
  });
});
