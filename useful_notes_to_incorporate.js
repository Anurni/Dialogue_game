setupSelect(document.querySelector("#select"))



//this goes to dialogue_game.js:
export function setupSelect(element) {
    const options = [{emoji: "", name: ""},
    {emoji: "", name: ""},
    {emoji: "", name: ""}];
for (const option of options){

    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.innerHTLM = option.emoji; //innerHTLM determines what will show up on the button
    optionButton.addEventListener("click", () => {
        raise({type: "SELECT", value: option.name}) //raise sends an event to itself??
    });
    element.appendChild(optionButton);
    }
    }


    // this will go in the code also (dialogue_game)
    // if the user is pressing buttons instead of spekaing, we need to stop the recognizer

    on: {
        SELECT: {
            actions: [({context}) => context.ssRef.send({type: "STOP"}),
            ({context, event}) => context.ssRef.send({type: "SPEAK", value: { utterance: `You selected ${event.value}`}}),

            ]}
    }


    // to show the buttons only at a certain state ???

