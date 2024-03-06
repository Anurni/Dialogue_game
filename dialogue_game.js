import { assign, createActor, setup } from "xstate";
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
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-JaneNeural",
};

// our grammar, replace yes/no/hint/quit with NLU:
const grammar = {
  agreeWords: ["yes","yup","of course","yeah", "absolutely"],
  disagreeWords: ["no","nope","nah"],
  correctAnswer: ["That's correct!", "Well done!", "Exactly!", "You got it!" ],
  wrongAnswer: ["Try again!", "Better luck next time!"],
};

// our functions:
function isInGrammar(utterance) {
    return (utterance.toLowerCase() in grammar);
  }

function randomRepeat(myArray) {
  const randomIndex = Math.floor(Math,random()*myArray.length);
  return myArray[randomIndex]
}

function checkPositive(event) {
  return event === "yes";
}
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
  
      //add assign action
  
  }}).createMachine({
  id: "dialogueGame",
  initial: "Prepare",
  context: {
    user_name: '',
    something_1: '',
    something_2: '',
    something_3: '',
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
          RECOGNISED: {actions: assign({user_name: ({event}) => event.nluValue.entities[0].text}), target: "TestingYesOrNo"},
      },
    },

  TestingYesOrNo: {
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
    entry: [{ type: "say", params: `Here we gooo! These are the instructions..Are you ready?`}], 
    on: {
      SPEAK_COMPLETE: "CheckIfReady"
      },
    },
  CheckIfReady : {
    entry : "listen",
    on : {
      RECOGNISED : [{guard : ({event}) => checkPositive(event.nluValue.entities[0].category),
      target : "ChooseCategory",
      actions : {type : "say", params : "Time to choose a category. Choose wisely!" }},
      {target : "Done"}]
    }
  },
  ChooseCategory : {
    entry : "listen",
    on : {
      RECOGNISED : [{guard : ({event}) => event.nluValue.entities[0].text === "Geography", target : "Geography"},
      {guard : ({event}) => event.nluValue.entities[0].text === "General Knowledge", target : "GeneralKnowledge"},
      {guard : ({event}) => event.nluValue.entities[0].text === "History", target : "History"},
      {target : "ChooseCategory", reenter : true,
      actions : {type : "say", params : ({context}) => `You need to choose a category, ${context.user_name}`}}]
    }
  },
                  //just testing out stuff, 
  Geography: {    //target for Listen sub-states needs to be some sort of reaction state, need to add that later
    initial: "Question1Speak",
    states: {
      Question1Speak: { entry: [{ type: "say", params: "What is the capital city of Australia?"}], on: {SPEAK_COMPLETE: "Question1Listen"}},
      Question1Listen: { entry: "listen", on: {RECOGNISED: "Question2Speak"}},
      Question2Speak: {entry: [{ type: "say", params: "What is the hottest country in the world?"}], on: {SPEAK_COMPLETE: "Question2Listen"}},
      Question2Listen: {entry: "listen", on: {RECOGNISED: "Question3Speak"}},
      Question3Speak: {entry: [{ type: "say", params: "How many continents are there?"}], on: {SPEAK_COMPLETE: "Question3Listen"}},
      Question3Listen: {entry: "listen", on: {RECOGNISED: "#dialogueGame.ChooseCategory",
      actions : {type : "say", params : "You need to choose another category now."}}},
    }
  },
  GeneralKnowledge :{
    initial: "Question1GN",
    states : {
      Question1GN : { entry: [{ type: "say", params: "Which planet is known as the \"Red Planet\"?"}], on: {SPEAK_COMPLETE: "Question1ListenGN"}},
      Question1ListenGN :  { entry: "listen", on: {RECOGNISED: "Question2GN"}},
      Question2GN : { entry: [{ type: "say", params: "What is the tallest mountain in the world?"}], on: {SPEAK_COMPLETE: "Question2ListenGN"}},
      Question2ListenGN : { entry: "listen", on: {RECOGNISED: "Question3GN"}},
      Question3GN : { entry: [{ type: "say", params: "What is the main ingredient in hummus?"}], on: {SPEAK_COMPLETE: "Question3ListenGN"}},
      Question3ListenGN : { entry: "listen", on: {RECOGNISED: "Question4GN"}},
      Question4GN : { entry: [{ type: "say", params: "Who is the current monarch of Sweden?"}], on: {SPEAK_COMPLETE: "Question4ListenGN"}},
      Question4ListenGN : { entry: "listen", on: {RECOGNISED: "Question5GN"}},
      Question5GN : { entry: [{ type: "say", params: "What is the largest organ in the human body?"}], on: {SPEAK_COMPLETE: "Question5ListenGN"}},
      Question5ListenGN : { entry: "listen", on: {RECOGNISED: "#dialogueGame.ChooseCategory"}},
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
Question :{ },
  // our guards which will be modified later
  guards: {
    didPlayerWin: (context, event) => {
      // check if player won
      return context.points > 99;
    },
    didPlayerLose: (context, event) => {
      // check if player lost
      return context.points < 0;
    }
  }
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
  }) //} <= if i close this here i can export the second one as well and even the start name works but there is a different error :') 
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
  
  
  dmActor.getSnapshot().context.ssRef.subscribe((snapshot) => {
    element.innerHTML = `${snapshot.value.AsrTtsManager.Ready}`;
  });
  }
//}

