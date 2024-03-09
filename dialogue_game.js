import { assign, createActor, setup, fromCallback, sendTo } from "xstate";
import { speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure.js"; 
import { showElements } from "./main.js";

/* comments :
-should we give 2nd try to answer the question or provide the hint perhaps? after the answer is incorrect --> yes definitely
*/
const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY, 
};

const azureLanguageCredentials = {
  endpoint: "https://annis-lab4.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2022-10-01-preview",
  key: NLU_KEY,
  deploymentName: "dialogue_game",
  projectName: "dialogue_game",
};

// our settings:
const settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials,
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 10000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-JaneNeural",
};

// old grammar, works with old states
//const grammar = {
//  geography: {question1: "canberra", question2: "mali", question3: "7", question4: "pacific", question5: "chile"},  
//  generalKnowledge: {question1: "mars", question2: "mount everest", question3: "chickpea", question4: "carl gustav", question5: "skin"}, 
//  history: {question1: ["george washington"], question2: ["1914"], question3: ["ancient greece"], question4: ["hitler"] || ["adolfus hitler"], question5: ["egyptians"]||["the egyptians"]}, 
//  science: {question1: ["photosynthesis"], question2: ["gravity"], question3: ["diamond"], question4: ["evaporation"], question5: ["mercury"]}  
//};

//new question database, will work once we have one/four working question states
const questions = {
  geography: [{ "What is the capital city of Australia?" : "Canberra"}, {"What is the hottest country in the world?" : "Mali"}, {"How many continents are there?" : "7"}, {"What is the name of the largest ocean in the world?" : "Pacific"}, {"Which country does the Easter Island belong to?": "Chile"}],
  generalKnowledge: [{ "Which planet is known as the red planet?" : "Mars"}, {"What is the main ingredient in hummus" : "Chickpea"}, {"Who is the current monarch of Sweden?" : "Carl Gustav"}, {"What is the largest organ in the human body?" : "skin"}, {"What is the tallest mountain in the world?": "Mount Everest"}],
  history: [{ "Who was the first president of the United States?" : "George Washington"}, {"What year did World War I begin?" : "1914"}, {"What ancient civilization is credited with the invention of democracy?" : "ancient greece"}, {"Who was the leader of Nazi Germany during World War II?" : "hitler"}, {"Which civilization build the Great Pyramids of Giza?": "egyptians"}],
  science: [{ "What is the process by which plants make their food called?" : "photosynthesis"}, {"What is the force that pulls objects towards the center of the Earth called? " : "gravity"}, {"What is the hardest natural substance on Earth?" : "diamond"}, {"What is the process by which water changes from a liquid to a gas called?" : "evaporation"}, {"What is the only metal that is liquid at room temperature?": "mercury"}]
}

const correctAnswer = ["That's correct!", "Well done!", "Exactly!", "You got it!" ];
const wrongAnswer = ["Try again!", "Better luck next time!", "Not quite!"];
const typhoonReaction = ["You've hit the typhoon!", "It's the typhoon!", "Watch out for the typhoon!"];

// our functions:
function isInGrammar(utterance) {
    return (utterance.toLowerCase() in grammar); //not sure if we'll need this
  }

function randomRepeat(myArray) {
  const randomIndex = Math.floor(Math.random()*myArray.length);
  return myArray[randomIndex]
  }

function checkPositive(event) {
    return event === "yes";
  }

//old function that checks if the user's answer is correct  -- works only with 'grammar'
//function checkAnswer (event, category, question) {
//    return grammar[category][question].includes(event.toLowerCase());
//}

//this function should work with the new randomizing questions state, once we have one...
function chooseQuestion(category) {
  const questionList = questions[category];
  // put some if-statement here to check if the question is in the context.askedQuestions
  const questionAndAnswer = randomRepeat(questionList);
  const onlyQuestion = Object.keys(questionAndAnswer);
  return onlyQuestion  // need to test if this works and now only the key (the question) is returned
 }

//new function that checks if the user's answer is correct  -- works only with 'questions'
function checkAnswer(event, question) {
  const correctAnswer = Object.values(question[0]);
  return event.toLowerCase() === correctAnswer.toLowerCase();
}


// trying to move the setupSelect logic into a callback actor that we can invoke from the "choose a category" state  
//function setupSelect(element) { fromCallback(({ sendBack, receive }) => {
//  const options = [
//    {emoji : "🏫", name : "General Knowledge" },
//    {emoji : "🌍", name : "Geography"},
//    {emoji : "📕", name : "History"},
//    {emoji : "🧪", name : "Science"}
//  ];
//  for (const option of options) {
//    const optionButton = document.createElement("button");
//   optionButton.type = "button";
//    optionButton.innerHTML = option.emoji;
//    optionButton.addEventListener("click", () => {
//      dmActor.send({type:"CLICK"});
//    });
//    element.appendChild(optionButton);
//  }
//  }
// )
//}
// export {setupSelect};

//creating the machine:
const dialogueGame = setup({
    actions: {
      listenNlu : ({ context }) => 
      context.ssRef.send({
         type: "LISTEN", value: { nlu: true } }),

      listen : ({ context }) => 
      context.ssRef.send({
      type: "LISTEN"}),
  
      say : ({ context}, params) => 
      context.ssRef.send({
         type: "SPEAK",
        value: {
          utterance: params
        },
      }),
      show : () => showElements("category_buttons")  //tested adding () =>

      /*displayCategoryButtons(element) {    //we should be able to create the category buttons from here, as an action, then call the action from the state
        const options = [
        {emoji : "🏫", name : "General Knowledge" },
        {emoji : "🌍", name : "Geography"},
        {emoji : "📕", name : "History"},
        {emoji : "🧪", name : "Science"}
      ];
      for (const option of options) {
        const optionButton = document.createElement("button");
        optionButton.type = "button";
        optionButton.innerHTML = option.emoji;
        optionButton.addEventListener("click", () => {
          dmActor.send({type:"CLICK"});
        });
      }
      element.style.display = "none";  //something like this should work for making the button disappear on "CLICK" event
    } */

      //add the button display actions here!
    },
    guards: {
      didPlayerWin: (context, event) => {
          // check if player won
          return context.points > 99;
        },
      didPlayerLose: (context, event) => {
          // check if player lost
          return context.points < 0;
        }
    },

  }).createMachine({
  id: "dialogueGame",
  initial: "Prepare",
  context: {
    user_name: '',
    something_1: '',
    something_2: '',
    something_3: '',
    points: 0,
    currentQuestion: null
  },
  states: {
    Prepare: {
        entry: [
        assign({
        ssRef: ({ spawn }) => spawn(speechstate, { input: settings }),
            }),
            ({ context }) => context.ssRef.send({ type: "PREPARE" }),
            ],
        on: { 
            ASRTTS_READY: "WaitToStart" },
    },

  WaitToStart: {
    on: {
      CLICK: "SayGreeting"
    }
  },

  SayGreeting: {
    entry: [{type: "say", params: "Welcome to the Typhoon game! What is your name?"}, "displayCategoryButtons"],
    on: {
        SPEAK_COMPLETE: "ListenGreeting"
        }
    },

    ListenGreeting: {
      entry: "listenNlu",
      on: {
          RECOGNISED: {actions: assign({user_name: ({event}) => event.nluValue.entities[0].text}), target: "GameStartVerification"},
      },
    },

  GameStartVerification: {
    entry: [{type: "say", params: ({context}) => `Hi there ${context.user_name}!Do you want to start the game?`}],
    on: {
      SPEAK_COMPLETE: "ListenYesOrNo"
    }
  },

  ListenYesOrNo: {
    entry: "listenNlu",
    on: {
      RECOGNISED: [{guard: ({event}) => checkPositive(event.nluValue.entities[0].category), target: "SayInstructions" },
      {guard:({event}) => event.nluValue.entities[0].category === "no", target: "Done" }],
    }
  },

  SayInstructions: {
    entry: [{ type: "say", params: `Here we go! These are the instructions..Are you ready?`}], 
    on: {
      SPEAK_COMPLETE: "CheckIfReady"
      },
    },

  CheckIfReady : {
    entry : "listenNlu",
    on : {
      RECOGNISED :
       { guard : ({event}) => checkPositive(event.nluValue.entities[0].category),
      target : "AskCategory"}
    }
  },

  AskCategory: { 
    entry: ["show", {type: "say", params: `Time to choose a category. Choose wisely!`}],
    on: {
      SPEAK_COMPLETE: "ClickOnCategory"
    }
  },

  ClickOnCategory : {   //work in process here, had to change this back so that I can test the geography state:
    entry: "listen",
    on : {
      RECOGNISED : 
      [{guard : ({ event }) => event.value[0].utterance === "Geography", target : "Geography"},
      {guard : ({ event }) => event.value[0].utterance === "General Knowledge", target : "GeneralKnowledge"},
      {guard : ({ event }) => event.value[0].utterance === "History", target : "History"},
      {guard : ({ event }) => event.value[0].utterance === "Science", target : "Science"}],
      //{target : "AskCategory", reenter : true,
      //actions : {type : "say", params : ({context}) => `You need to choose a category, ${context.user_name}`}}] //does this work? --> yes it asked me that
    }
  },

  Geography: {    
    initial: "questionGeography",
    states: {
      questionGeography : {   // testing the question randomizing function here
        entry: [
          assign({ currentQuestion: () => chooseQuestion(['geography'])}),  //assigning the randomly chosen question into context so that we can use it to check if the answer is correct later
          { type: 'say', params: ({ context }) => Object.values(context.currentQuestion)[0] }
              ],         
        on: {
            SPEAK_COMPLETE: "listenGeography"
        }
    },

    listenGeography: {
      entry: "listen",
      on: {
        RECOGNISED: [
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, Object.keys(context.currentQuestion)[0]), actions: ({context}) =>  context.points ++ , target: "reactCorrectGeography"},
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, Object.keys(context.currentQuestion)[0]) === false, actions: ({context}) =>  context.points - 1 , target: "reactIncorrectGeography"},
      ]}
    },
   
    reactCorrectGeography: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    
        on: { 
          SPEAK_COMPLETE: "questionGeography"
          },
        },

    reactIncorrectGeography: {
      entry: [{type: "say", params: randomRepeat(wrongAnswer)}],    
      on: { 
        SPEAK_COMPLETE: "questionGeography"
        },
      },

    Typhoon: { entry: [{type: "say", params: randomRepeat(typhoonReaction)}], 
      actions: assign({points: 0}), //player loses all their points
      on: { 
        SPEAK_COMPLETE: "#dialogueGame.Done"}}, // need to set the target elsewhere eventually
          },
      },

  //the rest three states "General Knowledge", "History" and "Science" will go here

    Done: {
    on: { CLICK: "SayGreeting"}
  },

  AHistory: {
    type: "history",
    history: "deep"
    },
  },
})

const dmActor = createActor(dialogueGame, {
  inspect: inspector.inspect,
}).start();

dmActor.subscribe((state) => {
  /* if you want to log some parts of the state */
});

export function setupButton(element) {
  element.addEventListener("click", () => {
    dmActor.send({ type: "CLICK" });
  })}
  
  //} <= if i close this here i can export the second one as well and even the start name works but there is a different error :') 
  /*export function setupSelect(element) {
  const options = [
    {emoji : "🏫", name : "General Knowledge" },
    {emoji : "🌍", name : "Geography"},
    {emoji : "📕", name : "History"},
    {emoji : "🧪", name : "Science"}
    ];
    for (const option of options) {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.innerHTML = option.emoji;
      optionButton.addEventListener("click", () => {
        dmActor.send({type:"CLICK"});
      });
      element.appendChild(optionButton);
    }*/
  
  //dmActor.getSnapshot().context.ssRef.subscribe((snapshot) => {
  //  element.innerHTML = `${snapshot.value.AsrTtsManager.Ready}`;
  //});


