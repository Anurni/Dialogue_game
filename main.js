import "./style.css";
import { setupButton,/*setupSelect*/ } from "./dialogue_game.js"; //setupSelect in the brackets needed 

document.querySelector("#app").innerHTML = `
  <div id = "start_container">
   <h1 id="game_title">Typhoon game</h1>
      <button id="startButton" class="button">Start</button></div>
  <div class="category_buttons" style =  "display : none">
    <h2 id="category"> Choose your poison </h2>
      <button class="category_buttons">General Knowledge</button>
      <button class="category_buttons">Geography</button>
      <button class="category_buttons">History</button>
      <button class="category_buttons">Science</button>
      </div>
  <div class="question_boxes"style = "display : none">
    <h3 id="box">Pick a box!</h3>
      <button class="question_boxes" button id="1">1</button>
      <button class="question_boxes" button id="2">2</button>
      <button class="question_boxes" button id="3">3</button>
      <button class="question_boxes" button id="4">4</button>
      <button class="question_boxes" button id="5">5</button>
      <button class="question_boxes" button id="6">6</button>
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

export function hideAllElements(elements) {   //leaving this for now
  elements.forEach(element => {
    document.getElementById(element).style.display="none";
  });
}

export function hideElement(params) {
  document.getElementById(params).style.display="none";
}

export function hideCategoryElements(element) {  //this will be used to hide the category buttons
  const elements = document.getElementsByClassName(element);
  for (let i = 0; i < elements.length; i++) {
      elements[i].style.display = "none";
  }
}
 
//