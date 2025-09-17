// Firebase importieren
import { initializeApp } from "firebase/app";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs 
} from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC11STApxGXQoCFQsOZEfpItgWYUChXKYQ",
  authDomain: "klassen-chooser.firebaseapp.com",
  projectId: "klassen-chooser",
  storageBucket: "klassen-chooser.appspot.com",
  messagingSenderId: "196733798812",
  appId: "1:196733798812:web:94db849e5b2dc2012ba059",
  measurementId: "G-GHH42LMHHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI Elemente
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const adminDiv = document.getElementById("admin");
const currentStudentEl = document.getElementById("currentStudent");
const chooseBtn = document.getElementById("chooseBtn");

// Schülerliste (voreingestellt)
const students = ["Max", "Lisa", "Paul", "Sophie", "Jonas"];

// === LOGIN ===
loginBtn.onclick = () => {
  signInWithEmailAndPassword(auth, emailInput.value, passInput.value)
    .catch(err => alert("Fehler: " + err.message));
};

logoutBtn.onclick = () => {
  signOut(auth);
};

// Auth-State beobachten
onAuthStateChanged(auth, user => {
  if (user) {
    adminDiv.style.display = "block";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    emailInput.style.display = "none";
    passInput.style.display = "none";
  } else {
    adminDiv.style.display = "none";
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    emailInput.style.display = "inline";
    passInput.style.display = "inline";
  }
});

// === Schüler in Firestore vorbereiten ===
async function initStudents() {
  for (let name of students) {
    const ref = doc(db, "students", name);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      await setDoc(ref, { count: 0 }); // jeder fängt bei 0 an
    }
  }
}

// === Fair auswählen ===
chooseBtn.onclick = async () => {
  await initStudents(); // sicherstellen, dass alle drin sind
  const snapshot = await getDocs(collection(db, "students"));

  let minCount = Infinity;
  let candidates = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.count < minCount) {
      minCount = data.count;
      candidates = [docSnap.id];
    } else if (data.count === minCount) {
      candidates.push(docSnap.id);
    }
  });

  // zufällig aus den Kandidaten mit Minimum auswählen
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Zähler erhöhen
  await updateDoc(doc(db, "students", chosen), { count: minCount + 1 });

  // als "gerade ausgewählt" speichern
  await setDoc(doc(db, "status", "current"), { name: chosen });

  // sofort anzeigen
  currentStudentEl.textContent = chosen;
};

// === Aktuellen Schüler anzeigen ===
async function loadCurrentStudent() {
  const docRef = doc(db, "status", "current");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    currentStudentEl.textContent = snapshot.data().name;
  }
}
loadCurrentStudent();
