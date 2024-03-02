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
  wrongAnswer: ["Try again!", "Better luck next time!"]
};

// our functions:
function isInGrammar(utterance) {
    return (utterance.toLowerCase() in grammar);
  }

function randomRepeat(myArray) {
  const randomIndex = Math.floor(Math,random()*myArray.length);
  return myArray[randomIndex]
}

//creating the machine:
const dialogueGame = setup({
    actions: {
      listenForUsersAnswer : ({ context }) => 
      context.ssRef.send({
         type: "LISTEN", value: { nlu: true } }),
  
      speakToTheUser : ({ context}, params) => 
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
    entry: [{type: "speakToTheUser", params: "Welcome to the game! What is your name?"}],
    on: {
        SPEAK_COMPLETE: "ListenGreeting"
        }
    },

  ListenGreeting: {
    entry: "listenForUsersAnswer",
    on: {
        RECOGNISED: {actions: assign({user_name: ({event}) => event.value[0].utterance}), target: "SayInstructions"},
    },
  },

  SayInstructions: {
    entry: [{ type: "speakToTheUser", params: ({context}) => `Hi there ${context.user_name}! These are the instructions...`}],
    on: {
      SPEAK_COMPLETE: "Geography"
      },
    },

                  //just testing out stuff, 
  Geography: {    //target for Listen sub-states needs to be some sort of reaction state, need to add that later
    initial: "Question1Speak",
    states: {
      Question1Speak: { entry: [{ type: "speakToTheUser", params: "What is the capital city of Australia?"}], on: {SPEAK_COMPLETE: "Question1Listen"}},
      Question1Listen: { entry: "listenForUsersAnswer", on: {RECOGNISED: "Question2Speak"}},
      Question2Speak: {entry: [{ type: "speakToTheUser", params: "What is the hottest country in the world?"}], on: {SPEAK_COMPLETE: "Question2Listen"}},
      Question2Listen: {entry: "listenForUsersAnswer", on: {RECOGNISED: "Question2Speak"}},
      Question3Speak: {entry: [{ type: "speakToTheUser", params: "How many continents are there?"}], on: {SPEAK_COMPLETE: "Question3Listen"}},
      Question3Listen: {entry: "listenForUsersAnswer", on: {RECOGNISED: "#dialogueGame.Done"}},
    }
  },

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
  });
  dmActor.getSnapshot().context.ssRef.subscribe((snapshot) => {
    element.innerHTML = `${snapshot.value.AsrTtsManager.Ready}`;
  });
}

