import "./style.css";
import { setupButton } from "./dialogue_game.js"; //setupSelect in the brackets needed 

document.querySelector("#app").innerHTML = `
  <div>
    <div class="container">
    <div id = "question"> Question </div>
    <div id="answer-buttons" class="btn-grid">
    </div>
    <div class = "controls">
      <button id="startButton" class="button">Start</button>
    </div> 
  </div>
`;

//setupSelect(document.querySelector("select"))
setupButton(document.querySelector("#startButton"));
