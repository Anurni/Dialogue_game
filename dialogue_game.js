import { assign, createActor, setup } from "xstate";
import { speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure.js"; //whose key should we be using?


const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY, //whose key??
};

// our settings:
const settings = {
  azureCredentials: azureCredentials,
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-JaneNeural",
};

// our grammar:
const grammar = {
  agreeWords: ["yes","yup","of course","yeah", "absolutely", "it will", "yes please"],
  disagreewords: ["no","nope","nah", "no thanks"]
};

// our functions:
function isInGrammar(utterance) {
    return (utterance.toLowerCase() in grammar);
  }

//creating the machine:
const dialogueGame = setup({
    actions: {
      listenForUsersAnswer : ({ context }) => 
      context.ssRef.send({
         type: "LISTEN" }),
  
      speakToTheUser : ({ context}, params) => 
      context.ssRef.send({
         type: "SPEAK",
        value: {
          utterance: params
        },
      }),
  
      //add assign action
  
  }}).createMachine({
    
    context: {
    something_1: '',
    something_2: '',
    something_3: '',
  },

  id: "dialogueGame",
  initial: "Prepare",
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
        RECOGNISED: "SayInstructions"
    },
    },

  SayInstructions: {
    entry: [{ type: "speakToTheUser", params: "These are the instructions..."}],
    on: {
      SPEAK_COMPLETE: "Game1"
      },
    },
  },
})

