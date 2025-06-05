const emojis = ["🍎", "🍌", "🍇", "🍓", "🍍", "🍒", "🥝", "🍉"];
let cards = [...emojis, ...emojis];
cards = cards.sort(() => 0.5 - Math.random());

const board = document.getElementById("memory-game");
const message = document.getElementById("message");

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;

function createBoard() {
  cards.forEach((symbol) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.symbol = symbol;

    card.addEventListener("click", () => {
      if (lockBoard || card.classList.contains("revealed")) return;

      card.classList.add("revealed");

      if (!firstCard) {
        firstCard = card;
      } else {
        secondCard = card;
        checkMatch();
      }
    });

    board.appendChild(card);
  });
}

function checkMatch() {
  lockBoard = true;

  const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

  if (isMatch) {
    matchedPairs++;
    resetSelection();
    if (matchedPairs === emojis.length) {
      message.innerText = "🎉 Du hast alle Paare gefunden!";
    }
  } else {
    setTimeout(() => {
      firstCard.classList.remove("revealed");
      secondCard.classList.remove("revealed");
      resetSelection();
    }, 1000);
  }
}

function resetSelection() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

createBoard();
