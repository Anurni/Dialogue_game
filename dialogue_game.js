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
  geography: [
  {"typhoon": "typhoon"},
  { "What is the capital city of Australia?" : ["Canberra", "This capital city is also known as the Bush Capital"]}, 
  {"What is the hottest country in the world?" : ["Mali", "This country is located in West Africa."]},
  {"How many continents are there?" : ["7", "Don't forget the one where penguins live!"]}, 
  {"What is the name of the largest ocean in the world?" : ["Pacific", "This ocean starts with P"]}, 
  {"Which country does the Easter Island belong to?": ["Chile", "The shape of this country is skinny!"]}, 
  {"What is the smallest country in the world by land area?": ["Vatican City", "This is where the Pope lives."]},
  {"Which desert is the largest in the world?": ["Sahara Desert", "This desert spreads over many countries of the Northern Africa"]},
  {"Which country is both in Europe and Asia?":["Russia", "It happens to also be the largest country in the world."]},
  {"Which continent is the least populated?":["Antarctica", "It's very cool in there!"]},
  {"Which city is referred as the City of Lights": ["Paris", "Its most visited monument is a very iconic tower."]}],
  generalKnowledge: [
  {"typhoon": "typhoon"},
  { "Which planet is known as the red planet?" : ["Mars", "This planet is a key target in the search for extraterrestrial life."]}, 
  {"What is the main ingredient in hummus" : "Chickpea"}, 
  {"Who is the current monarch of Sweden?" : "Carl Gustav"}, 
  {"What is the largest organ in the human body?" : "skin"}, 
  {"What is the tallest mountain in the world?": "Mount Everest"}],
  history: [
  {"typhoon": "typhoon"}, 
  { "Who was the first president of the United States?" : ["George Washington","He played an important role in the American Revolutionary War"]}, 
  {"What year did World War I begin?" : ["1914","It's the same year that the Titanic sank"]}, 
  {"What ancient civilization is credited with the invention of democracy?" : ["Ancient Greece","This civilization is famous for starting the Olympic Games"]}, 
  {"Who was the leader of Nazi Germany during World War II?" : ["Hitler","He was born in Austria"]}, 
  {"Which civilization build the Great Pyramids of Giza?": ["Egyptians", "They are known for their advanced knowledge in architecture,engineering and astronomy"]},
  {"Who was the first Emperor of Rome?": ["Augustus","He was the great-nephew of Julius Caesar"]},
  {"Who was the longest-reigning monarch in British history?": ["Queen Elisabeth II","Her nickname when she was a child was Lilibet"]},
  {"What was the name of the ship that brought the Pilgrims to America in 1620?":["The Mayflower","It's named after a flower that blooms in spring"]},
  {"Who was the first woman to fly solo across the Atlantic Ocean?":["Amelia Earhart", "She disappeared during an attempted flight around the world in 1937"]},
  {"Who was the first woman to win a Nobel Prize?":["Marie Curie","Her contributions has helped in finding treatments of cancer."]}],

  science: [
  {"typhoon": "typhoon"}, 
  { "What is the process by which plants make their food called?" : "Photosynthesis"}, 
  {"What is the force that pulls objects towards the center of the Earth called? " : "Gravity"}, 
  {"What is the hardest natural substance on Earth?" : "Diamond"}, 
  {"What is the process by which water changes from a liquid to a gas called?" : "Evaporation"}, 
  {"What is the only metal that is liquid at room temperature?": "Mercury"},
  {"What type of energy is stored in food?": "Chemical energy"},
  {"What is the center of an atom called?":"Nucleus"}, 
  {"What is the study of the atmosphere and its phenomena called?":"Meteorology"}, 
  {"What is the unit of electrical power?":"Watt"}]
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

//retrieves a question from the question database based on the index of the box the user has chosen
function chooseQuestion(category, index) {
  const questionList = questions[category];
  // put some if-statement here to check if the question is in the context.askedQuestions, eventually...
  const questionAndAnswer = questionList[index];
  return questionAndAnswer 
 }

//function that checks if the user's answer is correct
function checkAnswer(event, question) {
  const correctAnswer = Object.values[0](question);  //let's see if adding an index [0] will work to get the answer
  const finalEvent = event.toLowerCase();
  const finalCorrectAnswer = correctAnswer[0].toLowerCase();  
  return (finalEvent === finalCorrectAnswer);
}

//function that retrieves the hint for the question
function retrieveHint(question) {
  const answerAndHint = Object.values(question);
  const finalhint = answerAndHint[1];
  return finalhint;
}

//function to shuffle questions and typhoon so they aren't in the same place always
function shuffleQuestions (questions) {
  for (const category in questions) {
    if (questions.hasOwnProperty(category)) {
      const categoryQuestions = questions[category];
    
    for (let i = categoryQuestions.length -1; i > 0; i --) {
      const j = Math.floor(Math.random()*(i+1));
      [categoryQuestions[i],categoryQuestions[j]] = [categoryQuestions[j],categoryQuestions[i]];
    }
  }
}
}

function checkBoxNumber(box) {
  return box;
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
      shuffle : () => shuffleQuestions(questions),
      show : () => showElements("category_buttons"),
      showBoxes : () => showElements("question_boxes"), //didn't manage to combine them lets leave them as is?
      hideStart : () => hideAllElements(["startButton","game_title"]),  
      hideCategories : () => hideCategoryElements("category_buttons"),
      hideBox : ({context},params) => hideElement(params), //this doesn't work either
      
    },
    guards: {  //lets see if we will use these
      didPlayerWin: (context, event) => {
          // check if player won
          return context.points > 99;
        },
      didPlayerLose: (context, event) => {
          // check if player lost
          return context.points < 0;
        },
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
    entry: ["shuffle", {type : "say", params: "Welcome to the Typhoon game! What is your name?"}],
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
      {guard:({event}) => event.nluValue.entities[0].category === "no", actions: [{ type: "say", params: ({ context}) => `See you maybe another time, ${context.user_name}`}], target: "Done" }],
    }
  },

  SayInstructions: {
    entry: [{ type: "say", params: `Here we go! These are the instructions. If you need a hint, say "hint". Let's start!`}], 
    on: {
      SPEAK_COMPLETE: "AskCategory"
      },
    },

  //CheckIfReady : {
  //  entry : "listenNlu",
  //  on : {
  //    RECOGNISED :
  //     { guard : ({event}) => checkPositive(event.nluValue.entities[0].category),
  //    target : "AskCategory"}
  //  }
  //},

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
      actions : {type : "say", params : ({context}) => `You need to choose one of the categories on the screen, ${context.user_name}`}}]
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
      entry: ["listen", {type : "hideBox", params : ({context}) => `box${context.questionNumber}`}],
      on: {
        RECOGNISED: [     //lets change the hint to NluListen the intent is something like "hint"
        { guard: ({ event }) => event.value[0].utterance === "Hint", actions: [{ type: "say", params: ({context}) => retrieveHint(context.questionNumber)}]},
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion), actions:[ ({context}) =>  context.points ++], target: "reactCorrectGeography"},
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion) === false, actions:[ ({context}) =>  context.points - 1], target: "reactIncorrectGeography"},
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
  
  
  //dmActor.getSnapshot().context.ssRef.subscribe((snapshot) => {
  //  element.innerHTML = `${snapshot.value.AsrTtsManager.Ready}`;
  //});


