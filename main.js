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
    <button class="question_boxes" id="1" data-box-number="1">1</button>
    <button class="question_boxes" id="2" data-box-number="2">2</button>
    <button class="question_boxes" id="3" data-box-number="3">3</button>
    <button class="question_boxes" id="4" data-box-number="4">4</button>
    <button class="question_boxes" id="5" data-box-number="5">5</button>
    <button class="question_boxes" id="6" data-box-number="6">6</button>
  </div>
  <div class="typhoon"style =  "display : none">
    <h4 id="lose"style = 'font-size:30px'> You lose! Better luck next time! </3>
    <div style="width:280px;max-width:100%;"><div style="height:0;padding-bottom:150.69%;position:relative; left: 45px; margin-bottom = -100px, margin-top = -100px"><iframe width="260" height="200" style="position:absolute;top:100px;left:0;width:100%;height:100%;" frameBorder="0" src="https://imgflip.com/embed/8j7vyq"></iframe></div>
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

// lets see if this will work...
export function hideChosenBoxes(chosenBoxes) {
  const boxes = document.getElementsByClassName("question_boxes");
  for (let i = 1; i < boxes.length; i++) {
    const boxNumber = parseInt(boxes[i].getAttribute("data-box-number"));  // not sure about this getAtttribute
    if (chosenBoxes.includes(boxNumber)) {
      boxes[i].style.display = "none";
    } else {
      boxes[i].style.display = "block";
    }
  }
}
 
//