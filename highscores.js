// highscores.js
import { auth, db } from './firebase-init.js';
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

/**
 * Speichert einen neuen Highscore für das gegebene Spiel.
 * @param {string} game   Name des Spiels, z. B. "Snake"
 * @param {number} score  Erreichte Punktzahl
 */
export async function submitHighScore(game, score) {
  const user = auth.currentUser;
  if (!user) return;
  await addDoc(collection(db, 'highscores'), {
    game,
    score,
    user: user.email,
    timestamp: serverTimestamp(),
  });
}

/**
 * Liefert die Top-N-Highscores für ein Spiel.
 * @param {string} game         Name des Spiels
 * @param {number} [limit=10]   Anzahl der Einträge
 * @returns {Promise<Array>}    Array von {game, score, user, timestamp}
 */
export async function getTopScores(game, limit = 10) {
  const q = query(
    collection(db, 'highscores'),
    where('game', '==', game),
    orderBy('score', 'desc'),
    orderBy('timestamp', 'asc')
  );
  const snap = await getDocs(q);
  const results = [];
  snap.forEach(doc => results.push(doc.data()));
  return results.slice(0, limit);
}
