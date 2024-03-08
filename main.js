import "./style.css";
import { setupButton,/*setupSelect*/ } from "./dialogue_game.js"; //setupSelect in the brackets needed 

document.querySelector("#app").innerHTML = `
  <div id = "start container">
   <h1>Typhoon game</h1>
      <button id="startButton" class="button">Start</button>
      <button id="GenKnowButton" class="category-button">General Knowledge</button>
      <button id="GeogButton" class="category-button">Geography</button>
      <button id="HistButton" class="category-button">History</button>
      <button id="ScienceButton" class="category-button">Science</button>
  </div>
  <div class = "card" >
  <button id="counter" type="button" ></button>
  </div>
`;

setupButton(document.querySelector("#startButton"));
setupSelect(document.querySelector("#counter"));
setupSelect(document.querySelector("#displayCategoryButtons")); //not sureeee

//maybe we need to add the buttons in the style and thats why it doesn't work
//when I am in a specific state can I call this function somehow??-->
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
