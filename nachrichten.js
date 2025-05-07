import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { firebaseConfig } from './firebase-init.js';

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Nachricht senden
const form = document.getElementById("messageForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const recipient = document.getElementById("recipient").value;
  const message = document.getElementById("message").value;

  const user = auth.currentUser;
  if (!user) {
    alert("Du musst eingeloggt sein, um eine Nachricht zu senden.");
    return;
  }

  await addDoc(collection(db, "messages"), {
    from: user.email,
    to: recipient,
    message: message,
    timestamp: new Date()
  });

  alert("Nachricht gesendet!");
  form.reset();
});

// Nachrichten empfangen
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const inbox = document.getElementById("inbox");
    const q = query(collection(db, "messages"), where("to", "==", user.email));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const li = document.createElement("li");
      li.textContent = `Von ${doc.data().from}: ${doc.data().message}`;
      inbox.appendChild(li);
    });
  }
});
