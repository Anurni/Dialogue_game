import "./style.css";
import { setupButton } from "./dialogue_game.js"; //setupSelect in the brackets needed 

document.querySelector("#app").innerHTML = `
  <div id = "start container">
   <h1>Welcome to Typhoon game</h1>
      <button id="startButton" class="button">Start</button>
  </div>
`;

setupButton(document.querySelector("#startButton"));

function ChooseCategory() {
  appElement.innerHTML = `
<div class="category-container">
<h2>Choose a category:</h2>
<div class="category-buttons">
<button id="GenKnowButton" class="category-button">General Knowledge</button>
<button id="GeogButton" class="category-button">Geography</button>
<button id="HistButton" class="category-button">History</button>
<button id="ScienceButton" class="category-button">Science</button>
</div>
</div>`;
}
