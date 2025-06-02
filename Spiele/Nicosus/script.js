import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = window.auth;

onAuthStateChanged(auth, (user) => {
  const userLinks = document.getElementById("user-links");
  const logoutButton = document.getElementById("logout-button");

  if (user) {
    userLinks.style.display = "none";
    logoutButton.style.display = "inline-block";
  } else {
    userLinks.style.display = "inline-block";
    logoutButton.style.display = "none";
  }
});

document.getElementById("logout-button")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Erfolgreich abgemeldet.");
    location.reload();
  });
});
