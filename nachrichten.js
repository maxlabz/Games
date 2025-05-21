// nachrichten.js
import { db, auth } from './firebase-init.js';
import {
  collection, addDoc, query, where, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

const form = document.getElementById('messageForm');
const inbox = document.getElementById('inbox');

onAuthStateChanged(auth, user => {
  if (!user) return;

  // Nachrichten abrufen
  const q = query(collection(db, 'nachrichten'), where('empfaenger', '==', user.email));
  onSnapshot(q, snapshot => {
    inbox.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement('li');
      li.textContent = `Von ${data.absender}: ${data.text}`;
      inbox.appendChild(li);
    });
  });

  // Nachricht senden
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const empfaenger = document.getElementById('recipient').value.trim();
    const text = document.getElementById('message').value.trim();

    if (!empfaenger || !text) {
      return alert("Bitte Empfänger und Nachricht ausfüllen");
    }

    try {
      await addDoc(collection(db, 'nachrichten'), {
        absender: user.email,
        empfaenger,
        text,
        zeitstempel: serverTimestamp()
      });
      form.reset();
      alert('Nachricht gesendet!');
    } catch (err) {
      console.error('Fehler beim Senden:', err);
      alert('Fehler beim Senden der Nachricht');
    }
  });
});
