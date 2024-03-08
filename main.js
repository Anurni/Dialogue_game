import "./style.css";
import { setupButton,/*setupSelect*/ } from "./dialogue_game.js"; //setupSelect in the brackets needed 

document.querySelector("#app").innerHTML = `
  <div id = "start container">
   <h1>Typhoon game</h1>
      <button id="startButton" class="button">Start</button>
      </div>
  <div class="category_buttons" style =  "display : none">
      <button class="category_buttons">General Knowledge</button>
      <button class="category_buttons">Geography</button>
      <button class="category_buttons">History</button>
      <button class="category_buttons">Science</button>
  </div>
  </div>
`;

setupButton(document.querySelector("#startButton"));
document.querySelector("category_buttons")
//setupSelect(document.querySelector("#counter"));
//setupSelect(document.querySelector("#category_buttons")); //not sureeee

//maybe we need to add the buttons in the style and thats why it doesn't work
//when I am in a specific state can I call this function somehow??-->
/// I think this could work but something goes wrong and it doesn't 
export function showElements(element) { 
  const elements = document.getElementsByClassName(element);
  for (let i = 0; i < elements.length; i++) {
      elements[i].style.display = "block";
  }
}
