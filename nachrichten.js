// nachrichten.js
import { auth, db } from './firebase-init.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  collection, addDoc, query, where, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

window.sendeNachricht = async function () {
  const empfaenger = document.getElementById("empfaenger").value;
  const inhalt = document.getElementById("nachricht").value;

  const user = auth.currentUser;
  if (!user) {
    alert("Bitte zuerst einloggen.");
    return;
  }

  await addDoc(collection(db, "nachrichten"), {
    von: user.email,
    an: empfaenger,
    inhalt: inhalt,
    zeit: serverTimestamp()
  });

  alert("Nachricht gesendet!");
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const q = query(collection(db, "nachrichten"), where("an", "==", user.email));
    const querySnapshot = await getDocs(q);
    const liste = document.getElementById("nachrichtenListe");
    querySnapshot.forEach((doc) => {
      const daten = doc.data();
      const li = document.createElement("li");
      li.textContent = `[Von: ${daten.von}] ${daten.inhalt}`;
      liste.appendChild(li);
    });
  }
});