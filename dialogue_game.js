import { assign, createActor, setup, fromCallback, sendTo } from "xstate";
import { speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure.js"; 


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

// our grammar
const grammar = {
  geography: {question1: "canberra", question2: "mali", question3: "7", question4: "pacific", question5: "chile"},  
  generalKnowledge: {question1: "mars", question2: "mount everest", question3: "chickpea", question4: "carl gustav", question5: "skin"}, 
  history: {question1: [], question2: [], question3: [], question4: [], question5: []}, 
  science: {question1: [], question2: [], question3: [], question4: [], question5: []}  
};

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

//function that checks if the user's answer is correct
function checkAnswer (event, category, question) {
    return grammar[category][question].includes(event.toLowerCase());
}

function checkPositive(event) {
  return event === "yes";
}

// trying to move the setupSelect logic into a callback actor that we can invoke from the "choose a category" state  
const setupSelect = fromCallback(({ sendBack, receive }) => {
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
  }
  }
 );
 
//creating the machine:
const dialogueGame = setup({
    actions: {
      listen : ({ context }) => 
      context.ssRef.send({
         type: "LISTEN", value: { nlu: true } }),
  
      say : ({ context}, params) => 
      context.ssRef.send({
         type: "SPEAK",
        value: {
          utterance: params
        },
      }),

      //add assign action hereee
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

    //actors: {
    //  setupSelect
    //}

  }).createMachine({
  id: "dialogueGame",
  initial: "Prepare",
  context: {
    user_name: '',
    something_1: '',
    something_2: '',
    something_3: '',
    points: 0,
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
    entry: [{type: "say", params: "Welcome to the Typhoon game! What is your name?"}],
    on: {
        SPEAK_COMPLETE: "ListenGreeting"
        }
    },

    ListenGreeting: {
      entry: "listen",
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
    entry: "listen",
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
    entry : "listen",
    on : {
      RECOGNISED :
       { guard : ({event}) => checkPositive(event.nluValue.entities[0].category),
      target : "AskCategory"}
    }
  },

  AskCategory: {
    entry: [{type : "say", params : "Time to choose a category. Choose wisely!"}],
    invoke: {
      src: "setupSelect"  //trying to invoke the callback actor here to display the emoji buttons
    },
    on: {
      SPEAK_COMPLETE: "ListenCategory"
    }
  },

  ListenCategory : { 
    entry : "listen",
    on : {
      RECOGNISED : [{guard : ({event}) => event.value[0].utterance === "Geography", target : "Geography"},
      {guard : ({event}) => event.value[0].utterance === "General Knowledge", target : "GeneralKnowledge"},
      {guard : ({event}) => event.value[0].utterance === "History", target : "History"},
      {target : "AskCategory", reenter : true,
      actions : {type : "say", params : ({context}) => `You need to choose a category, ${context.user_name}`}}]
    }
  },

  Geography: {    
    initial: "Question1Speak",
    states: {
      Question1Speak: { 
        entry: [{ type: "say", params: "What is the capital city of Australia?"}], 
        on: { 
          SPEAK_COMPLETE: "Question1Listen"}},

      Question1Listen: { 
        entry: "listen", 
        on: { 
          RECOGNISED: 
          { guard: ({event}) => checkAnswer(event.value[0].utterance, geography, question1), actions: ({context}) =>  context.points ++ , target: "reactionState1"}}},    

      reactionState1: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "Question2Speak"
          },
        },

      Question2Speak: { 
        entry: [{ type: "say", params: "What is the hottest country in the world?"}], 
        on: { SPEAK_COMPLETE: "Question2Listen"}},

      Question2Listen: { 
        entry: "listen", 
        on: { 
          RECOGNISED:
          { guard: ({event}) => checkAnswer(event.value[0].utterance, geography, question2), actions: ({context}) => context.points ++ , target: "reactionState2"}}}, 
      
      reactionState2: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "Question3Speak"
          },
        },

      Question3Speak: { 
        entry: [{ type: "say", params: "How many continents are there?"}], 
        on: { SPEAK_COMPLETE: "Question3Listen"}},

      Question3Listen: { 
        entry: "listen", 
        on: { 
          RECOGNISED: 
          { guard: ({event}) => checkAnswer(event.value[0].utterance, geography, question3), actions: ({context}) => context.points++, target: "reactionState3"}  
      },
    },

      reactionState3: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "Question4Speak"
          },
        },

      Question4Speak: { 
        entry: [{ type: "say", params: "What is the name of the largest ocean in the world?"}], 
        on: { SPEAK_COMPLETE: "Question4Listen"}},

      Question4Listen: { 
        entry: "listen", 
        on: { 
          RECOGNISED: 
            { guard: ({event}) => checkAnswer(event.value[0].utterance, geography, question4), actions: ({context}) => context.points++, target: "reactionState4"}  
        },
      },

      reactionState4: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "Question5Speak"
          },
        },

      Question5Speak: { 
        entry: [{ type: "say", params: "Which country does the Easter Island belong to?"}], 
        on: { SPEAK_COMPLETE: "Question5Listen"}},

      Question5Listen: { 
        entry: "listen", 
        on: { 
          RECOGNISED: 
            { guard: ({event}) => checkAnswer(event.value[0].utterance, geography, question5), actions: ({context}) => context.points++, target: "reactionState5"}  
        },
      },

      reactionState5: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "geographyFinal"
          },
        },

      Typhoon: { entry: [{type: "say", params: randomRepeat(typhoonReaction)}], 
      actions: assign({points: 0}), //player loses all their points
      on: {SPEAK_COMPLETE: "#dialogueGame.Done"}}, // need to set the target elsewhere eventually

      geographyFinal: {
        entry: [{type : "say", params : "You need to choose another category now."}], 
        on: {
          SPEAK_COMPLETE: "#dialogueGame.AskCategory"
      }
    },
  },
},

  GeneralKnowledge : {
    initial: "Question1GN",
    states : {
    hist : {type : "history"},
      Question1GN : {
         entry: [{ type: "say", params: "Which planet is known as the \"Red Planet\"?"}], 
         on: {SPEAK_COMPLETE: "Question1ListenGN"}},

      Question1ListenGN :  { 
        entry: "listen", 
        on: {
          RECOGNISED:
          { guard: ({event}) => checkAnswer(event.value[0].utterance, generalKnowledge, question1), actions: ({context}) => context.points++, target: "reactionQuestion1GN"}}},

      reactionQuestion1GN : {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "Question2GN"
          },
        },

      Question2GN : { 
        entry: [{ type: "say", params: "What is the tallest mountain in the world?"}], 
        on: {SPEAK_COMPLETE: "Question2ListenGN"}},

      Question2ListenGN : { 
        entry: "listen", 
        on: {RECOGNISED:
          { guard: ({event}) => checkAnswer(event.value[0].utterance, generalKnowledge, question2), actions: ({context}) => context.points++, target: "reactionQuestion2GN"}}},

      reactionQuestion2GN : {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "Question3GN"
          },
        },

      Question3GN : { 
        entry: [{ type: "say", params: "What is the main ingredient in hummus?"}], 
        on: {SPEAK_COMPLETE: "Question3ListenGN"}},

      Question3ListenGN : { 
        entry: "listen", 
        on: {RECOGNISED:
          { guard: ({event}) => checkAnswer(event.value[0].utterance, generalKnowledge, question3), actions: ({context}) => context.points++, target: "reactionQuestion3GN"}}},

      reactionQuestion3GN : {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "Question4GN"
          },
        },

      Question4GN : { 
        entry: [{ type: "say", params: "Who is the current monarch of Sweden?"}], 
        on: {SPEAK_COMPLETE: "Question4ListenGN"}},

      Question4ListenGN : { 
        entry: "listen",
        on: {RECOGNISED:
          { guard: ({event}) => checkAnswer(event.value[0].utterance, generalKnowledge, question4), actions: ({context}) => context.points++, target: "reactionQuestion4GN"}}},

      reactionQuestion4GN : {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    // maybe we can implement reaction state much nicer at some point, this way will result in a lot of states...
        on: { 
          SPEAK_COMPLETE: "Question5GN"
          },
        },

      Question5GN : { 
        entry: [{ type: "say", params: "What is the largest organ in the human body?"}], 
        on: {SPEAK_COMPLETE: "Question5ListenGN"}},

      Question5ListenGN : { 
        entry: "listen", 
        on: {RECOGNISED:
          { guard: ({event}) => checkAnswer(event.value[0].utterance, generalKnowledge, question5), actions: ({context}) => context.points++, target: "reactionQuestion5GN"}}},

      reactionQuestion5GN : {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}],    
        target: "finalGeneralKnowledge"
            },

      finalGeneralKnowledge: {
        entry: [{type : "say", params : "You need to choose another category now."}], 
        on: {
          SPEAK_COMPLETE: "#dialogueGame.AskCategory"
      }
    },

    Typhoon: { entry: [{type: "say", params: randomRepeat(typhoonReaction)}], 
    actions: assign({points: 0}), //player loses all their points
      on: {SPEAK_COMPLETE: "#dialogueGame.Done"}} // need to set the target elsewhere eventually
    }
  },

  History :{},

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


