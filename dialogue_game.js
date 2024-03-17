import { assign, createActor, setup } from "xstate";
import { speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure.js"; 
import { showElements,hideElement, hideAllElements, hideCategoryElements, hideChosenBoxes } from "./main.js";


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

const correctAnswer = ["That's correct!", "Well done!", "Exactly!", "You got it!" ];
const wrongAnswer = ["Try again!", "Better luck next time!", "Not quite!"];
const typhoonReaction = ["You've hit the typhoon!", "It's the typhoon!", "Watch out for the typhoon!"];
const boxes = ["1","2","3","4","5","6","7","8","9","10"]
//new question database, will work once we have one/four working question states
const questions = {
  geography: [
  {"typhoon": randomRepeat(typhoonReaction)},
  { "What is the capital city of Australia?" : ["Canberra", "This capital city is also known as the Bush Capital"]}, 
  {"What is the hottest country in the world?" : ["Mali", "This country is located in West Africa."]},
  {"How many continents are there?" : ["7", "Don't forget the one where penguins live!"]}, 
  {"What is the name of the largest ocean in the world?" : ["Pacific", "The mame of this ocean starts with P"]}, 
  {"Which country does the Easter Island belong to?": ["Chile", "The shape of this country is skinny!"]}, 
  {"What is the smallest country in the world by land area?": ["Vatican City", "This is where the Pope lives."]},
  {"Which desert is the largest in the world?": ["Sahara Desert", "This desert spreads over many countries of the Northern Africa"]},
  {"Which country is both in Europe and Asia?":["Russia", "It also happens to be the largest country in the world."]},
  {"Which continent is the least populated?":["Antarctica", "It's very cool in there!"]},
  {"Which city is referred as the City of Lights": ["Paris", "Its most visited monument is a very iconic tower."]}],

  generalKnowledge: [
  {"typhoon": randomRepeat(typhoonReaction)},
  {"Which desert is the largest in the world?": ["Sahara Desert", "This desert spreads over many countries of the Northern Africa"]},
  {"Which city is referred as the City of Lights": ["Paris", "Its most visited monument is a very iconic tower."]},
  {"What year did World War I begin?" : ["1914","It's the same year that the Titanic sank"]}, 
  {"Who was the leader of Nazi Germany during World War II?" : ["Hitler","He was born in Austria"]},
  {"What is the force that pulls objects towards the center of the Earth called? " : ["Gravity","It's the force that keeps you on the ground and makes things fall downward"]},
  {"What is the hardest natural substance on Earth?" : ["Diamond","It's also used in jewellery"]}, 
  {"What is Batman's real name?":["Bruce Wayne","First name rhymes with 'loose' and last name with 'chain'."]},
  {"What is the largest organ in the human body?" : ["skin","It's an external organ with multiple layers and various functions."]},
  {"Which tech entrepreneur together with his partner named their son X Æ A-12" : ["Elon Musk","He is the CEO of Tesla."]}, 
  { "Which planet is known as the red planet?" : ["Mars", "This planet is a key target in the search for extraterrestrial life."]},

 ],
  history: [
  {"typhoon": randomRepeat(typhoonReaction)}, 
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
  {"typhoon": randomRepeat(typhoonReaction)}, 
  { "What is the process by which plants make their food called?" : ["Photosynthesis","This process involes the conversion of the sun"]}, 
  {"What is the force that pulls objects towards the center of the Earth called? " : ["Gravity","It's the force that keeps you on the ground and makes things fall downward"]}, 
  {"What is the hardest natural substance on Earth?" : ["Diamond","It's also used in jewellery"]}, 
  {"What is the process by which water changes from a liquid to a gas called?" : ["Evaporation","Think about what happens to water when heated"]}, 
  {"What is the only metal that is liquid at room temperature?": ["Mercury","It's a metal used in thermometers"]},
  {"What type of energy is stored in food?": ["Chemical energy","This energy is released after digestion"]},
  {"What is the center of an atom called?": ["Nucleus","It consists of protons and neutrons"]}, 
  {"What is the study of the atmosphere and its phenomena called?":["Meteorology","This field of study encompasses weather patterns and climate"]}, 
  {"What is the unit of electrical power?":["Watt","It measures the rate of energy used in electricity"]},
  {"What is the branch of science that deals with the study of heredity and variation in organisms?": ["Genetics","It involves the study of genes, DNA, and inheritance patterns"]}],

  popCulture: [
  {"typhoon": randomRepeat(typhoonReaction)}, 
  {"Which tech entrepreneur together with his partner named their son X Æ A-12" : ["Elon Musk","He is the CEO of Tesla."]}, 
  {"Which movie was mistakenly announced as the Best Picture Oscar winner in 2017? " : ["La La Land","Emma Stone and Ryan Gosling star in this musical."]}, 
  {"In the sitcom Friends, what was the name of Pheobe's alter ego?" : ["Regina Phalange","The initials are R.P."]}, 
  {"Which band recorded the album 'The Dark Side of the Moon'?" : ["Pink Floyd","This is one of the most famous British rock bands."]}, 
  {"What was the nickname of Diana, Princess of Wales?": ["Lady Di","There were many, but this one is a shorter version of her first name."]},
  {"Which artist made history in 2020 as the youngest winner of the Grammys' four main categories?": ["Billie Eilish","This artist creates music together with her big brother, Finneas."]},
  {"Which legendary horror movie popularized the quote 'All work and no play makes Jack a dull boy'?": ["The Shining","This movie is based on a Stephen King novel."]}, 
  {"Which italian band won the Eurovision song contest in 2021?":["Måneskin","The name of this band is danish for 'moonlight'"]}, 
  {"What is Batman's real name?":["Bruce Wayne","First name rhymes with 'loose' and last name with 'chain'."]},
  {"Which fashion designer is famous for inventing 'The Little Black Dress'?": ["Coco Chanel","One of the quotes of this iconic Frech designer is 'Fashion changes, but style endures'."]}]
}


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
  const questionAndAnswer = questionList[index];
  return questionAndAnswer 
 }

//function that checks if the user's answer is correct
function checkAnswer(event, question) {
  const correctAnswer = Object.values(question)[0];  
  const finalEvent = event.toLowerCase();
  const finalCorrectAnswer = correctAnswer[0].toLowerCase();  
  return (finalEvent === finalCorrectAnswer);
}

//function that retrieves the hint for the question
function retrieveHint(question) {
  const hint = Object.values(question)[0][1];
  return hint;
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

function typhoon(question) {
  if (question === "typhoon") {
    Object.values(question);
  }
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
      showTyphoon : () => showElements("typhoon"),
      showThumbsUp : () => showElements("win"),
      showBoxes : () => showElements("question_boxes"), 
      hideStart : () => hideAllElements(["startButton","game_title","typhoon_gif"]),  
      hideCategories : () => hideCategoryElements("category_buttons"),
      hideBox : ({context},params) => hideElement(params),
      hideChosenBoxes : ({context, params}) => hideChosenBoxes(context.hiddenBoxes),
      hideAllBoxes : () => hideCategoryElements("question_boxes")
    },
    guards: {  //lets see if we will put any of our guards here
    },

  }).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQJYEMA2B7KBXMA4mgLZgB0ACgE5gAOaNAxAIIDKASgCqesD67AUWYARAJoBtAAwBdRKFpZYKAC4osAOzkgAHogDMkvQHYyANgCMAJgAsADiO2ArLb12ANCACeiS-bPWATiCAx0DLPRCAX0iPVEwcfCJSMgB1NBVOLFZlBmVGAGEAGQBJfIBpKVkkEAUlVQ0tXQQ9FtsyS1MbAL1LSWtzCOsPbwRfE1NA4NCA8KiYkDjsPEISclY0TwIaMFV1KEZWCiEy3nyAeQBZCkKBTgFKrVqVNU1qps7h-VtrU3ajS0c5gcDgCRkkpmisXQS0SqzIhRQsGUYHUWzAOxQe0YgnOBAAcsVWAJhA9qk96q9QE1rOF2pMQmNHJIHHpPs1bJZLGRbKDAaY9OYgnpTBD5osEitkkkwNlcgA1MBUFAAMxQAGM0BSDkdmCdzlcbndSfJFM8Gm99CLrGQjFZrGDzIYLD82ZZzOZrdZJN7JI5er6+tZIQtoRLpfDEcj1KI4GcqHisNiBLiCUSSTJHqaKY19ALJNyeY5TJIAjTJI7TGzhQEyI4mT7zH6jMLLMHxctwwikSiY7A4wmkynCcTxOYqia6i8c80vXobZ17aYjNZnMy2YLXNyjPXLNv3R1W2LQx24V2o73+4mcWd8cOSZZxzUs1OLc1wuNfCXQcueZWvIhzBcX4fR9Xp3VMP022PWFknWTxinUJEqFwNUKVgbVjlOS5rlue4MzJZ9zSpfQwUcMgvV6P1TA5d1zCrUwazrEDG13FsoPiE9kmYWAAGt8k1MAoCwKhPAw3UsINXDjSfSciJ0RB-no31a3+QEjCXBxfXYmFJXIfIAAssEUMB+ORISRMHG9UxHfCJzNSl5IQKx10PKEOJgvTDOM0zBOE0Tr1vNNR0fckX2IhBARrQDl1LAxAk6RwqxLa1AQBd1bEbajvm0sM4QMozYBMgTzP85MrLvcQH0zWSHKaP0ovsQJrDigIEqUkxgT5CDLG-Rwcs4zyCqKsy-MswKRz0ELCNqxAmQamLmr6VqbD-EYOgiG1jCZCY+jBIMj3c3SyHy7zitGgLrJJawppq6d6rIaKmpatr-2aPRAQe+sPXCZqWn6jzjq8wqfJKsbLvERwbvs6cOSrOaHs5QFmucRxbX+o6CDAHAqDQWh9M8QGhoAISwbQAEV8CRF4xL1bDDTwqHs1fcx+WtW0ugmBwRRmdcf3aFoWlRxxQT0Wx0fDTHsdx-GI27dRMnyxEwDBirbJk6HmaCMjlsCIERSBIx1yXMjGxcFoplF-a3J0iWsagHG8YJs8UQVwylZVoKx2qjXwsFEIyB1gI9YsIxDdewDjFrAWWmbcFWr6g6bbhSX7elp3IxdrBFcKj2Ryqgjbs1-3A+Dg3eZsblnBaMtmT6cxxeTu2HZlgywDVHjOE8PGjPURhpNCuSmhsSOBh-HkPR+MORj1tmQI6X8UYbqUm7TwG247ruvN74LvaZ8Lh5MUe7HH6xJ-XZw2gCOfmXsd0l-IFPm4Jzvu40GmJJwo01YHmbRh5Ll+Q-mMPrFmiVw62jIhBZi3pnCuRDIdW2UtHZkAAI6UwpI-NO799SfwZrvMKjkD4PWMMfIOp8lxsjBPmb4wRQQhEdC4e+ZBMHIIwBnVEK9Ha53TIzAh7xGy1jtAEWwfQehB1ZK9XoXpPqgVal6WwjDE65WXkgmWbC5YsPxtwneBcfaOQsGRVKgQRHNR6gMdc5t2hm1cLaEETgmGaIJuoqMjjtH5zsnvfRAijHCNEWYiR09AJcgBMxUEzU5jW2UQ-Thaj2GuIuhVSa+DB6IAMYIroJixHmPDqfE224fT9CvqWBxMSnFxNKdo66yTf5pJ8Zk-x657DBJFCKewEQWYKJKaogmNA0CoXyMJGgqFXGHEwjg+m-dprTndH0AOdonACnUkEKeAFSxkVcCzPaQpqIJ0iQNZhpSyC9P6YMtuygRk6lppJI0XtdGeKaDM60QcbALL1ss10kgORkGZPWe0dYWhwPbADRxRywB9OUAhNUpzhkVNGeJcZUlv5TOZo6J58zHCLIYqCRp-sJibMkD1DkBKxZKP2SC-SmJzmwsuR-CZSLC7hQYtaEUXRmTFlcDyFyPJazWJXJsv6pLgWHO4jxZUwkFRKlVBqLUcKrm4MmQywhPyHrzNPi4H6tg2SlnMLWekwROjLi6anZBEqVSeAENoFQ2j6V6KHgogBJCXDqQsKAtkNEHq0OESEBi9dBUY0Oaa5U5rLV5ASZ7XhKSnKormS8jFbzsXh3BDqq+IESw7KXEap+ZBA2eAMmgPYysw02Qjb-MYDqgHOvAmAkYGV2i0NsBBCedgjCZtXjmvNBbtG3I8Xwnw3odWuCCAo1mAwebh26HOYRAstndAJa25BCYACqhUqAIVoLgPIsraWIpLdOTkNYDxMl3HWFkLpw7VysQLe0QIeT2L9Yg41MsUiYmwXTHd1TpmsxtEIzmDaGKWA+V8n53o-kYp6POmWzt1AUAwBsZgUB0i9yLTwj9r5fBfMAXYYBLqIIWPzJ6hRVFHTCgg+nOWMG4MIZfchnRPbI2+BmGYR12Gq2AfzAS+swp+j2lI7LKMFHPDwcQ243daH-5MYrSA3D47I5bW9Me-cqMSnqEVJgMo6gsAAHcMCQBgITYyJNyboOpluhFX9RO+zoQHGKrVmyOlRis5oQIB0Nh6sKBiynVMYHU1pnT0ByBQddlgd2NGbX3J8Bs9oXQZjlicBBIYr1Fkuf7W57mnmcbeY09p3T5A0FwAwSiLzPnsv+dfdcvBdze2jEi5ySYYE4uhFdF6mR3pSxugBCSvZQqVMZeK35vTziUSYx62prL-XC1lXGihyrkb7M1i-EKBZu46KJfCG0IETIrANsynodLo3fM5bIINjhI3MsHdKzR7t6twtOV9PN2hosMXLarAMLk9hNsMM+cuUUXX-Wnb64d45ygBlUCGVS-7Y2ctlflWFqrLNyzcmCDyZt4QSxVg6Dqpi5ZT6UVBHts7JW9NA8hdC8HRXIeldM2+8zqHfbFh1TyIdpYmkGACC9os7QvrrSCJ8n78Ck7JAABKRj8vpwqhmKb5ZMzSszFW6O-wjsBetjVlr0W+CpTbodmx0JbfeuEwukSi8C1nN2OdQsWcIYKEwg6gj9AXI54U6uhbli1xEIweO9dC5FyJVBxmNAG+UKNKn5WFW2p8FbsgNvtX27hgS8iITvoo3tFbfnUSyAB9F8djPFlze08crbyP9I7CASsO6Kse5yJfSWYR3cTDs9lLlvXrtFumgF6j8XjKboVsjC478Rs-bhYl4mHX73PSwUnNB2cpvweYct4AiuNoBLJgswFAMRriXQ7Wg5JtmYqNh269++GevoLwUk8n6hafMvqdy+u3Dhf3zosr-dO9BLPfua1gT8uUOgpOup-2awNUFAFENUQaAzUmSXKmN+GfOlOfJyDKEwPVY9X0GhV0W0X4P0esbcAEMEfkJhAAoA9QEAvjTObOCbIcIKWHejG9G0SYBRQwERboVAlmD-TAjAnA3bT3NYQA4A3LP3dQfAng6HGAvPIeagmzOg0WEsAJHwDFa0OTPocsAlQ1TgsgAQwg8gY7NQkA61WAsJQvYIDvUvbvHwFkciECZcJkVGboPA7g9Qo7dhLQsg8qcNEQxAPQ9vDKTvMvSRJcdbECIsBiceGwggogoHEHMHRwoQ99GbBXcJePYxJiY2FwV0ERX4UOesFNVqAYDgw-OERwk-VCM-CI2w7Q6A6I+XaZOImkBI7abcZIyRB0cifJZkTkf+XZP-AGYQDQZWIoUoCoSg3+YwJwSPO0JcAwN0VqdcEISdECZqY2HqUUeYDTCAOALQIFXSVwhAAAWmFDZC2O3DrSR0bVPkCHaPWPDGoDoAYDAE2PQ3LSw0rVdUkQ+ij0LAFAnRT3OLhDSAyCyByCoGUE2J6GUnLC6DsCDgYlWh8D8Bs2CHc0hLwI2DRAxD2CBIURMFBPtGZGrFHimKBDMBAmMFtCw0BWgiOig2RN2CgFuLsG5FTR2hs2MPZE5GszSjBH-hLAcVWFlABMDXVE1AIR-junUm+XpAmA5RFirBCGoQ9EAkBGijvhUKgwvHjCwCBMAjaG3E6FX3SN9GrVWUjhXB9Hel6AiHsERPgkQmUGQlQheHgBiOnBfxMAURCAcw5DkVf30B+DpAe06DCQCCYRFRBj8jRMY16EogBV8AsFdArndFoT6H5ABCUxUJOmBjOhEiBJpFrAXDkVvRXAA0S1gT+DSiykyU+LJIfSfiBLZ1egsDnCx3LA9HcwFVyJUUfQJlTLAAlz4M2I9FmQbS6FcF3Agmk2nnsBrFahaVdNYN42N1IN7PdR8VtEFEKXLieWjnimWWHxUJBVbnbhfi3luNYhoOcCCSLBYgLOnn+HXKvVai3PLIQUbm6TIAPJ7luP5EnUdWnLdGbHLj73rAJSsFtDd14zy0gI4W6XfJaADi-LrD9CBGkKcmcGdJCXLHNhsE+V42O0cU2Lt2+QSkMAiAgmrgsUdADmsQiF8FHl4zCNJxwodNfEI0j3ZJZmPiPSZPDJMERm9EorBG3APw6P9WfOJ0ILotKU2IUR1R+C6D7MdGEU1XDiaULxZgYiZG+H6ByMEsrNXgpXUCpUgoYvCkkvIhzNkpLAUTwwAVTUJQJQBF4xFTFSoD5OlUFORX3gxxjTsFSjNNPnXBZikr1S9HUgcFJMfLbKzRzQtRUE2N3xMtZSXGSkFC1UAh9OCF6EbTsp3IDUVDNQ7RgCPIsE8qcCsB8s9LgNLDpNAn5BgVFl4yXRXTXQ3QkscwGDIqnQFhmAymMF42fQciFOZi9Cim6G+24zaUc1NK5F1NEQxX7VnPYQEyE0xAXLdHSUCGXO1RrLWmQJtGaKIpPTnSyoh3O3ysMsci12IR-GdWHKCCawRycH7TZWEQGHxwB38zFy7PAJ7NOoeQcDaCxR5yAt8X1Kc1pOYjdB+E6ofIF2iSOsJwC3YSCyVluJUp2smGbFtBEV-MSw9EX1cw9H-WykOvJ2Ot4Klw0GG2JrhtuL9EX2iw6GFgFGBp6lanIjt1Dl8AFE5BeopwG3KVhvGwkoBAuubRZSWU2v0Fa0jwbHBHejBFCuhoOX5sB3H2BzEqVv817J6BMCerWxHI4zKp6FFk537WFAMCAm5pJoKIhVEvPzJ16x5puO+oAh6DIiWmEX+BmQcANtewDi+jlOxwEq+K90NwzKdoQHOqPnsFFqxSrH6BNgTyLGZEdHCBHxDo7KBg+qMzJr6rcsclYq3zpuW0I3okKqQJZmERpEAlTsDx9znNN0doqLQ1ssR1oUBFRlLxLp1TLsCMrt-yDvIGPzAopHr1uMtgeiLxER6Ct1jxrDQOonazrl9VbIHtH3sMb1H0FpNkdSurFrhhZOd0bHtGZqBGrtF1ottpHrDqsH5H5hKuWi+yLHLw+gwNix+E7zOIrP11XpEqhQvo3qvo6HzGZvko206uBt7yi021aWXC42CJ4M2P4uFqjoNRjskVPgxOaIxQvh6jgbsM7O7Ozt7M6F+Fq2EWdHyQUrWgYjnG4vBGbGFnIVwaILruC0KluJA0OKFHaUFldGocge9DGIYZ+CYdJvAscNHogl1SHQbV+ualdFCB1RaSXGijdGAREbXqjHEbDpES3suujpuueNCBYJgVqwxqhrT3yPPuKJCIbtv1m2HlvtmE6AfqhNGFML+W9BomET5HUZ-tJy0cbt9gws4cku3DAd4YcAemaPFIhM0v7rIAUFoHyFwAwGUFwBoAQf9kjp3tQZ7xITMATwsExo92XrIC6JUyBKXFnrtAdCdHxqmKMdTT+XimiGiCAA */
  id: "dialogueGame",
  initial: "Prepare",
  context: {
    user_name: '',
    questionNumber: 0,
    currentQuestion: null,
    askedQuestions: [],
    questionAsked : 0,
    hiddenBoxes: {},
   // currentBoxToHide: 0,
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
      CLICK: "AskCategory"  
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
      {guard:({event}) => event.nluValue.entities[0].category === "no", actions: [{ type: "say", params: ({ context}) => `See you maybe another time, ${context.user_name}`}], target: "Done" },
      {target : "ListenYesOrNo", reenter : true, actions : {type : "say", params : "You have to say yes or no"}}],
    }
  },

  SayInstructions: {
    entry: [{ type: "say", params: `Here we go! These are the instructions.`}], 
    on: {
      SPEAK_COMPLETE: "AskCategory"
      },
    },

  AskCategory: { 
    entry: ["hideStart","show", {type: "say", params: `Time to choose a category. Choose wisely!`}],
    on: {
      SPEAK_COMPLETE: "ChooseCategory"
    }
  },

  ChooseCategory : {   
    entry: "listen",
    on : {
      RECOGNISED : 
      [{guard : ({ event }) => event.value[0].utterance === "Geography", target : "Geography", actions: "hideCategories"},
      {guard : ({ event }) => event.value[0].utterance === "General Knowledge", target : "GeneralKnowledge", actions: "hideCategories"},
      {guard : ({ event }) => event.value[0].utterance === "History", target : "History", actions: "hideCategories"},
      {guard : ({ event }) => event.value[0].utterance === "Science", target : "Science", actions: "hideCategories"},
      {guard : ({ event }) => event.value[0].utterance === "Pop culture", target : "popCulture", actions: "hideCategories"},
      {target : "AskCategory", reenter : true, 
      actions : {type : "say", params : ({context}) => `You need to choose one of the categories on the screen,`}}] //let's add the user_name here later
    }
  },

  Geography: {    
    initial: "ChooseBoxQuestion",
    states: {
      ChooseBoxQuestion : {
        entry : [{ type: "hideChosenBoxes", params: ({ context }) => context.hiddenBoxes },
                 {type : "say", params : "Choose a box. I hope you don't get unlucky."}],
        on : {
          SPEAK_COMPLETE : "ListenToChoice"
        }
      },

      ListenToChoice : {
        entry : "listenNlu", 
        on : {
          RECOGNISED : [ 
            // checking if the user wants to quit:
            { guard: ({ event }) => event.nluValue.topIntent === "game_options",
              target: "AskforVerification"},  //saying I want to give up doesn't work maybe it needs more training
             //maybe we can add an intent to change category??
             {guard : ({event})=> event.nluValue.topIntent === "changeCategory",
             target : "AskVerifyChange"},
            // otherwise, assigning the box/question number to context and proceeding to "checkTyphoon":
            { guard : ({event})=> boxes.includes(event.value[0].utterance),
            actions : [
              assign({
                questionNumber: ({ event }) => event.value[0].utterance,
                hiddenBoxes: ({ context, event }) => ({
                  ...context.hiddenBoxes, // Copy existing properties
                  [event.value[0].utterance]: event.value[0].utterance // Add new property with event value as key and value
                })
              }) 
            ],
            target: "CheckTyphoon"},
            // it doesn't work i will add a new state
            {target: "ListenToChoice",reenter : true, 
            actions: {type: "say", params: "You need to pick a box between 1 and 10."}}
          ],
        },
      }, 

      CheckTyphoon : { //we need to fix this somehow to add a target if the machine makes a mistake
        entry :  assign({ currentQuestion: ({ context }) => chooseQuestion(['geography'], context.questionNumber)}),
        always : [
          {guard : ({context}) => Object.keys(context.currentQuestion) === "typhoon", 
           target : "Typhoon"},
          {guard : ({context})=> Object.keys(context.currentQuestion) !== "typhoon",
           target: "questionGeography"}],
        },

      Typhoon : {
        entry : ["showTyphoon",{type : "say", params : ({context}) => Object.values(context.currentQuestion)}],
        on : {SPEAK_COMPLETE : "#dialogueGame.Done"}
      },

      questionGeography : {   
        entry :[{ type: 'say', params: ({ context }) => Object.keys(context.currentQuestion)},({ context }) => console.log(context.currentQuestion)],
         on: {SPEAK_COMPLETE :"listenGeography"}
      },

    listenGeography: {
      entry: ["listenNlu", /*{type : "hideBox", params : ({ context }) => context.questionNumber}*/],  //removed the backticks, let's see if it will make a difference
      on: {
        RECOGNISED: [  
        // checking if the user's answer is correct:
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion), actions:[ ({context}) =>  context.points ++], target: "reactCorrectGeography"},
        // checking if the user wants a hint:
        { guard: ({ event }) => event.nluValue.topIntent === "hint", target: "hintGeography"},
        // checking if the user wants to quit:
        { guard: ({ event }) => event.nluValue.topIntent === "game_options", target: "AskforVerification"},
        //checking if the user wants to hear the question again:
        { guard: ({ event }) => event.nluValue.topIntent === "repeat", target: "questionGeography"}, //actions: [{ type: "say", params: "I'm happy to repeat the question!"}]}, this wont work either we dont provide a message or add a state
        // checking if the user's answer is incorrect:
        { guard: ({event, context}) => checkAnswer(event.value[0].utterance, context.currentQuestion) === false, target: "reactIncorrectGeography"},
      ],

      //ASR_NOINPUT: {
      //  target: "NoUserInput"
      //}
    }
  },
   
    reactCorrectGeography: {
        entry: [{type: "say", params: randomRepeat(correctAnswer)}, ({context})=> context.questionAsked++],    
        on: { 
          SPEAK_COMPLETE: [
            {guard: ({context}) => context.questionAsked < 5, target :"ChooseBoxQuestion"},
            {guard : ({context}) => context.questionAsked === 5, target : "Win"}
          ]
          },
        },

    reactIncorrectGeography: {
      entry: [{type: "say", params: randomRepeat(wrongAnswer)}],    
      on: { 
        SPEAK_COMPLETE: "ChooseBoxQuestion"
        },
      },

    hintGeography: {
      entry: [{ type: "say", params: ({context}) => retrieveHint(context.currentQuestion)}],
      on: {
        SPEAK_COMPLETE: "listenGeography", reenter: true
      }
    },

    // if you want, we can add an extra "say goodbye" state after this  
    // lets also check where the machine transitions on "no"
    AskforVerification : {
      entry:  [{ type: "say", params: "Are you sure you want to exit the game?"}],
      on : {
        SPEAK_COMPLETE : "VerifyExit"
      }
    },
    VerifyExit: { 
    entry:"listenNlu",
    on: {
      RECOGNISED: [
        {guard: ({event}) => checkPositive(event.nluValue.entities[0].category), target: "#dialogueGame.Done",
        actions : {type: "say", params : "I hope you come to play again"}},
        {target: "ChooseBoxQuestion"}]
      }
    },
    AskVerifyChange : {
      entry : {type : "say", params : "Are you sure you want to change categories?"},
      on : {SPEAK_COMPLETE: "VerifyChange"}
    },
    VerifyChange: {
      entry: "listenNlu",
      on: {
        RECOGNISED: [
          {guard: ({event}) => checkPositive(event.nluValue.entities[0].category), target: "#dialogueGame.AskCategory"},
          {target: "ChooseBoxQuestion"}]
        }
      },

    //let's check where we want to implement this other than in the actual question 
    NoUserInput: {
        entry: [{ type: "say", params: "Can you please repeat?"}],
        on: {
          SPEAK_COMPLETE: "listenGeography"
        }
    },

  Win : { 
    entry :[ "hideAllBoxes", "showThumbsUp", {type : "say", params : ({context}) => `Congratulations ${context.user_name}, you won! Do you want to play again?`}],
    on : {SPEAK_COMPLETE : "ListenPlayAgain"}
  },

  ListenPlayAgain : {
    entry: "listenNlu",
    on: {
      RECOGNISED: [{guard: ({event}) => checkPositive(event.nluValue.entities[0].category), target: "#dialogueGame.AskCategory" },
      {guard:({event}) => event.nluValue.entities[0].category === "no", actions: [{ type: "say", params: ({ context}) => `I hope to see you again, ${context.user_name}.`}], target: "#dialogueGame.Done" },
      {target : "#dialogueGame.ListenYesOrNo", reenter : true, actions : {type : "say", params : "You have to say yes or no"}}],
        }
      },
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

    popCulture: {

    },
  
  Done: {
    on: { CLICK: "SayGreeting"}
  },
  
  //AHistory: {  //let's see if we will even use this
   // type: "history",
   // history: "deep"
    //},
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
  //S})


