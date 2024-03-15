import "./style.css";
import { setupButton } from "./dialogue_game.js";

document.querySelector("#app").innerHTML = `
  <div id = "start_container">
   <h1 id="game_title">Typhoon game</h1>
    <button id="startButton" class="button">Start</button></div>
      <img id = "typhoon_gif" src="typhoon_gif.gif">
  <div class="category_buttons" style =  "display : none">
    <h2 id="category"> Choose your poison </h2>
      <button class="category_buttons">General Knowledge</button>
      <button class="category_buttons">Geography</button>
      <button class="category_buttons">History</button>
      <button class="category_buttons">Science</button>
      <button class="category_buttons">Pop Culture</button>
      </div>
  <div class="question_boxes" style = "display: none"> 
    <h3 id="box">Pick a box!</h3>
    <button class="question_boxes" id="0">1</button>
    <button class="question_boxes" id="1">2</button>
    <button class="question_boxes" id="2">3</button>
    <button class="question_boxes" id="3">4</button>
    <button class="question_boxes" id="4">5</button>
    <button class="question_boxes" id="5">6</button>
  </div>
  <div class="typhoon"style =  "display : none">
    <h4 id="lose"style = 'font-size:30px'> You lose! Better luck next time! </3>
    <div style="width:280px;max-width:100%;"><div style="height:0;padding-bottom:150.69%;position:relative; left: 45px; margin-bottom = -100px, margin-top = -100px"><iframe width="260" height="200" style="position:absolute;top:100px;left:0;width:100%;height:100%;" frameBorder="0" src="https://imgflip.com/embed/8j7vyq"></iframe></div>
  </div> 
  </div> 
  <div class="win" style="display:none;">
    <h4 id="win" style="font-size:30px;">You win! Congrats!</h4>
    <div style="width:280px;max-width:100%;">
        <div style="height:0;padding-bottom:150.69%;position:relative;left:45px;margin-bottom:-100px;margin-top:-100px;">
            <iframe width="260" height="200" style="position:absolute;top:100px;left:0;width:100%;height:100%;" frameborder="0" src="thumbs-up.gif"></iframe>
        </div>
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

//this function is used to display only those question boxes that have not yet been chosen
// !!!!! does not yet remove exactly the correct box, but the logic kinda works
// i think removes by index

export function hideChosenBoxes(params) {
  const boxes = document.getElementsByClassName("question_boxes");
  const values = Object.values(params);         // Extract the values from the params object into an array
  for (let i = 0; i < boxes.length; i++) {    //need to check if -1 is needed
    const boxNumber = i;
    const boxNumberAsString = boxNumber.toString();
    //const box = document.getElementById(boxNumber.toString());       
    if (values.includes(boxNumberAsString)) {
      console.log(`This box should be removed ${boxNumber}`)
     // boxes[i].style.display = "none";              //works
      boxes[boxNumber].style.display = "none";    //works
    } else {
      console.log(`This box should be left ${boxNumber}`)
     // boxes[i].style.display = "block";            //works
      boxes[boxNumber].style.display = "block";  // works
    }
  }
}

// typhoon gif that works (even tho a bit small)
//<div style="width:300px;max-width:100%;"><div style="height:100;padding-bottom:200%;position:relative; left: 90px; margin-bottom = -100px, margin-top = -100px"><iframe width="1000" height="1000" style="position:absolute;top:100px;left:0;width:200%;height:200%;" frameBorder="0" src="typhoon_gif.gif"</iframe></div>