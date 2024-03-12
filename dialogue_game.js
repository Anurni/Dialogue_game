import { assign, createActor, setup } from "xstate";
import { speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure.js"; 
import { showElements,hideElement, hideAllElements, hideCategoryElements } from "./main.js";

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

//new question database, will work once we have one/four working question states
const questions = {
  geography: [{"typhoon": "typhoon"}, { "What is the capital city of Australia?" : "Canberra"}, {"What is the hottest country in the world?" : "Mali"}, {"How many continents are there?" : "7"}, {"What is the name of the largest ocean in the world?" : "Pacific"}, {"Which country does the Easter Island belong to?": "Chile"}],
  generalKnowledge: [{"typhoon": "typhoon"}, { "Which planet is known as the red planet?" : "Mars"}, {"What is the main ingredient in hummus" : "Chickpea"}, {"Who is the current monarch of Sweden?" : "Carl Gustav"}, {"What is the largest organ in the human body?" : "skin"}, {"What is the tallest mountain in the world?": "Mount Everest"}],
  history: [{"typhoon": "typhoon"}, { "Who was the first president of the United States?" : "George Washington"}, {"What year did World War I begin?" : "1914"}, {"What ancient civilization is credited with the invention of democracy?" : "ancient greece"}, {"Who was the leader of Nazi Germany during World War II?" : "hitler"}, {"Which civilization build the Great Pyramids of Giza?": "egyptians"}],
  science: [{"typhoon": "typhoon"}, { "What is the process by which plants make their food called?" : "photosynthesis"}, {"What is the force that pulls objects towards the center of the Earth called? " : "gravity"}, {"What is the hardest natural substance on Earth?" : "diamond"}, {"What is the process by which water changes from a liquid to a gas called?" : "evaporation"}, {"What is the only metal that is liquid at room temperature?": "mercury"}]
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

//retrieves a 'random' question from the question database based on the index of the box the user has chosen
function chooseQuestion(category, index) {
  const questionList = questions[category];
  // put some if-statement here to check if the question is in the context.askedQuestions, eventually...
  const questionAndAnswer = questionList[index];
  return questionAndAnswer 
 }

//function that checks if the user's answer is correct
function checkAnswer(event, question) {
  const correctAnswer = Object.values(question);
  const finalEvent = event.toLowerCase();
  const finalCorrectAnswer = correctAnswer[0].toLowerCase();  
  return (finalEvent === finalCorrectAnswer);
}


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
      show : () => showElements("category_buttons"),
      showBoxes : () => showElements("question_boxes"), //let's check how to combine all show actions ??
      hideStart : () => hideAllElements(["startButton","game_title"]),  // let's check how to combine all hide actions ??
      hideCategories : () => hideCategoryElements("category_buttons"),
      hideBox1 : () => hideElement("box1"),
      hideBox2 : () => hideElement("box2"),
      hideBox3 : () => hideElement("box3"),
      hideBox4 : () => hideElement("box4"),
      hideBox5 : () => hideElement("box5"),
      hideBox6 : () => hideElement("box6")
      
    },
    guards: {  //lets see if we will use these
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
    questionNumber: 0,
    points: 0,
    currentQuestion: null,
    askedQuestions: [],
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
    entry: [{type : "say", params: "Welcome to the Typhoon game! What is your name?"}],
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
    entry: [{ type: "say", params: `Here we go! These are the instructions...`}], 
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
    entry: ["hideStart","show", {type: "say", params: `Time to choose a category. Choose wisely!`}],
    on: {
      SPEAK_COMPLETE: "ChooseCategory"
    }
  },

  ChooseCategory : {   //work in process here, had to change this back so that I can test the geography state:
    entry: "listen",
    on : {
      RECOGNISED : 
      [{guard : ({ event }) => event.value[0].utterance === "Geography", target : "Geography", actions: "hideCategories"},
      {guard : ({ event }) => event.value[0].utterance === "General Knowledge", target : "GeneralKnowledge", actions: "hideCategories"},
      {guard : ({ event }) => event.value[0].utterance === "History", target : "History", actions: "hideCategories"},
      {guard : ({ event }) => event.value[0].utterance === "Science", target : "Science", actions: "hideCategories"},
      {target : "AskCategory", //in case the user's utterance does not match the given categories
      reenter : true, 
      actions : {type : "say", params : ({context}) => `You need to choose a category from the screen, ${context.user_name}`}}]
    }
  },

  Geography: {    
    initial: "ChooseBoxQuestion",
    states: {
      ChooseBoxQuestion : {
        entry : ["showBoxes", {type : "say", params : "Choose a box. I hope you don't get unlucky."}],
        on : {
          SPEAK_COMPLETE : "ListenToChoise"
        }
      },
      ListenToChoise : {
        entry : "listen", //maybe we should add a new topIntent of boxes --> let's check this !!!
        on : {
          RECOGNISED : "questionGeography",
          actions : assign({questionNumber : (event) => event.value[0].utterance}) //this should work, let's see
        }
      },
      questionGeography : {   
        entry: [
          assign({ currentQuestion: ({ context }) => chooseQuestion(['geography'], context.questionNumber)}),  //assigning the randomly chosen question object to the context
          { type: 'say', params: ({ context }) => Object.keys(context.currentQuestion) } //saying the key of the question object
              ],         
        on: {
            SPEAK_COMPLETE: {target: "listenGeography", actions: ({ context }) => console.log(context.currentQuestion)}
        }
    },

    listenGeography: {
      entry: "listen",
      on: {
        RECOGNISED: [
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion), actions:[ ({context}) =>  context.points ++, "hideBox1" ], target: "reactCorrectGeography"},
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion) === false, actions:[ ({context}) =>  context.points - 1, "hideBox1"], target: "reactIncorrectGeography"},
      ]}
    },
   
    reactCorrectGeography: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    
        on: { 
          SPEAK_COMPLETE: "ChooseBoxQuestion"
          },
        },

    reactIncorrectGeography: {
      entry: [{type: "say", params: randomRepeat(wrongAnswer)}],    
      on: { 
        SPEAK_COMPLETE: "ChooseBoxQuestion"
        },
      },

    //Typhoon: { entry: [{type: "say", params: randomRepeat(typhoonReaction)}], 
    //  actions: assign({points: 0}), //player loses all their points
     // on: { 
     //   SPEAK_COMPLETE: "#dialogueGame.Done"}}, // need to set the target elsewhere eventually
     //     },
      },
  },

  GeneralKnowledge: {
    initial: "ChooseBoxQuestion",
    states: {
      ChooseBoxQuestion : {
        entry : [{type : "say", params : "Choose a box. I hope you don't get unlucky."}],
        on : {
          SPEAK_COMPLETE : "ListenToChoise"
        }
      },
      ListenToChoise : {
        entry : "listenNlu", //maybe we should add a new topIntent of boxes
        on : {
          RECOGNISED : "questionGeneralKnowledge",
          actions : assign({questionNumber : (event) => event.value[0].utterance}) 
        }
      },
      questionGeneralKnowledge : {   
        entry: [
          assign({ currentQuestion: ( context ) => chooseQuestion(['generalKnowledge'], context.questionNumber)}),  //assigning the randomly chosen question object to the context
          { type: 'say', params: ({ context }) => Object.keys(context.currentQuestion) } //saying the key of the question object
              ],         
        on: {
            SPEAK_COMPLETE: {target: "listenGeneralKnowledge", actions: ({ context }) => console.log(context.currentQuestion)}
        }
    },

    listenGeneralKnowledge: {
      entry: "listen",
      on: {
        RECOGNISED: [
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion), actions: ({context}) =>  context.points ++ , target: "reactCorrectGeneralKnowledge"},
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion) === false, actions: ({context}) =>  context.points - 1 , target: "reactIncorrectGeneralKnowledge"},
      ]}
    },
   
    reactCorrectGeneralKnowledge: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    
        on: { 
          SPEAK_COMPLETE: "ChooseBoxQuestion"
          },
        },

    reactIncorrectGeneralKnowledge: {
      entry: [{type: "say", params: randomRepeat(wrongAnswer)}],    
      on: { 
        SPEAK_COMPLETE: "ChooseBoxQuestion"
        },
      },
    },
  },

  History: {
      initial: "ChooseBoxQuestion",
      states: {
        ChooseBoxQuestion : {
          entry : [{type : "say", params : "Choose a box. I hope you don't get unlucky."}],
          on : {
            SPEAK_COMPLETE : "ListenToChoise"
          }
        },
        ListenToChoise : {
          entry : "listenNlu", //maybe we should add a new topIntent of boxes
          on : {
            RECOGNISED : "questionHistory",
            actions : assign({questionNumber : (event) => event.value[0].utterance}) 
          }
        },
        questionHistory : {   
          entry: [
            assign({ currentQuestion: ( context) => chooseQuestion(['history'], context.questionNumber)}),  //assigning the randomly chosen question object to the context
            { type: 'say', params: ({ context }) => Object.keys(context.currentQuestion) } //saying the key of the question object
                ],         
          on: {
              SPEAK_COMPLETE: {target: "listenHistory", actions: ({ context }) => console.log(context.currentQuestion)}
          }
      },
  
      listenHistory: {
        entry: "listen",
        on: {
          RECOGNISED: [
          { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion), actions: ({context}) =>  context.points ++ , target: "reactCorrectHistory"},
          { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion) === false, actions: ({context}) =>  context.points - 1 , target: "reactIncorrectHistory"},
        ]}
      },
     
      reactCorrectHistory: {
          entry: [{type: "say", params: randomRepeat(correctAnswer)}],    
          on: { 
            SPEAK_COMPLETE: "ChooseBoxQuestion"
            },
          },
  
      reactIncorrectHistory: {
        entry: [{type: "say", params: randomRepeat(wrongAnswer)}],    
        on: { 
          SPEAK_COMPLETE: "ChooseBoxQuestion"
          },
      },
    },
  },

  Science: {
      initial: "ChooseBoxQuestion",
      states: {
        ChooseBoxQuestion : {
          entry : [{type : "say", params : "Choose a box. I hope you don't get unlucky."}],
          on : {
            SPEAK_COMPLETE : "ListenToChoise"
          }
        },
        ListenToChoise : {
          entry : "listenNlu", //maybe we should add a new topIntent of boxes
          on : {
            RECOGNISED : "questionScience",
            actions : assign({questionNumber : (event) => event.value[0].utterance}) //this needs an actual event also not sure about the logic lets talk about it..
          }
        },
        questionScience : {   
          entry: [
            assign({ currentQuestion: ( context) => chooseQuestion(['science'], context.questionNumber)}),  //assigning the randomly chosen question object to the context
            { type: 'say', params: ({ context }) => Object.keys(context.currentQuestion) } //saying the key of the question object
                ],         
          on: {
              SPEAK_COMPLETE: {target: "listenScience", actions: ({ context }) => console.log(context.currentQuestion)}
          }
      },
  
      listenScience: {
        entry: "listen",
        on: {
          RECOGNISED: [
          { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion), actions: ({context}) =>  context.points ++ , target: "reactCorrectScience"},
          { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion) === false, actions: ({context}) =>  context.points - 1 , target: "reactIncorrectScience"},
        ]}
      },
     
      reactCorrectScience: {
          entry: [{type: "say", params: randomRepeat(correctAnswer)}],    
          on: { 
            SPEAK_COMPLETE: "ChooseBoxQuestion"
            },
          },
  
      reactIncorrectScience: {
        entry: [{type: "say", params: randomRepeat(wrongAnswer)}],    
        on: { 
          SPEAK_COMPLETE: "ChooseBoxQuestion"
          },
        },
      },
    },

  Done: {
    on: { CLICK: "SayGreeting"}
  },

  AHistory: {  //let's see if we will even use this
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


