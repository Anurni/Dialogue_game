import "./style.css";
import { setupButton,setupSelect } from "./dialogue_game.js";

document.querySelector("#app").innerHTML = `
  <div>
    <div class="card" id ="select">
    </div>
    <div class = "card">
      <button id="startButton" type="button">Start</button>
    </div> 
  </div>
`;

setupButton(document.querySelector("#select"))
setupButton(document.querySelector("#startButton"));
