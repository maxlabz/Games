// nachrichten.js
import { db, auth } from './firebase-init.js';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// HTML-Elemente
const form = document.getElementById('messageForm');
const recipientInput = document.getElementById('recipient');
const messageInput = document.getElementById('message');
const inbox = document.getElementById('inbox');

onAuthStateChanged(auth, user => {
  if (!user) return;

  const userEmail = user.email;

  // Nachricht senden
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipient = recipientInput.value.trim();
    const text = messageInput.value.trim();

    if (!recipient || !text) return;

    try {
      await addDoc(collection(db, 'nachrichten'), {
        sender: userEmail,
        recipient,
        message: text,
        timestamp: new Date()
      });
      messageInput.value = '';
    } catch (error) {
      console.error('Fehler beim Senden:', error);
    }
  });

  // Nachrichten empfangen
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
