import "./style.css";
import { setupButton } from "./dialogue_game.js"; //setupSelect in the brackets needed 

document.querySelector("#app").innerHTML = `
  <div>
    <div class="card" id ="select">
    </div>
    <div class = "card">
      <button id="startButton" type="button">Start</button>
    </div> 
  </div>
`;

//setupSelect(document.querySelector("select"))
setupButton(document.querySelector("#startButton"));
