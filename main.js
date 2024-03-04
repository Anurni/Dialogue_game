import "./style.css";
import { setupButton } from "./dialogue_game.js";

document.querySelector("#app").innerHTML = `
  <div>
    <div class="card">
      <button id="startButton" type="button">Start</button>
    </div> 
  </div>
`;

setupButton(document.querySelector("#startButton"));
