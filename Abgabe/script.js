// Liste erlaubter Nutzer
const users = {
  "lehrer1": "passwort123",
  "lehrerin": "geheim",
  // weitere Lehrer hier einfügen
};

document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (users[username] === password) {
    // Weiterleitung zur Dateiseite
    localStorage.setItem("eingeloggt", "true");
    window.location.href = "daten.html";
  } else {
    document.getElementById("errorMsg").textContent = "Falscher Benutzername oder Passwort!";
  }
});
