import "./style.css";
import { setupButton,/*setupSelect*/ } from "./dialogue_game.js"; //setupSelect in the brackets needed 

document.querySelector("#app").innerHTML = `
  <div id = "start_container">
   <h1 id="game_title">Typhoon game</h1>
      <button id="startButton" class="button">Start</button>
      </div>
  <div class="category_buttons"style =  "display : none" >
    <h2 id="category">Choose your poison</h2>
      <button class="category_buttons">General Knowledge</button>
      <button class="category_buttons">Geography</button>
      <button class="category_buttons">History</button>
      <button class="category_buttons">Science</button>
  </div>
  </div>
`;

setupButton(document.querySelector("#startButton"));
document.querySelector("category_buttons")

export function showElements(element) { 
  const elements = document.getElementsByClassName(element);
  for (let i = 0; i < elements.length; i++) {
      elements[i].style.display = "block";
  }
}

export function hideElement(elements) {
  elements.forEach(element => {
    document.getElementById(element).style.display="none";
  });
 
}
//