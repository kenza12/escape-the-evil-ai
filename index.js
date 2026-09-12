"use strict";

const SECURITY_CODE = "0427";

const ROOMS = {
  CONTROL: "control",
  MAINTENANCE: "maintenance",
  POWER: "power",
  SECURITY: "security",
  TUNNEL: "tunnel",
};

const ENDINGS = {
  ESCAPE: "escape",
  DEFEAT: "defeat",
};

const INITIAL_STATE = Object.freeze({
  hasSecurityCode: false,
  hasAccessCard: false,
  isPowerDisabled: false,
});

const ITEM_LABELS = {
  hasSecurityCode: "the security code",
  hasAccessCard: "an access card",
  isPowerDisabled: "you have disabled the power system",
};

const MAX_ECHOED_INPUT_LENGTH = 20;

const UNKNOWN_CHOICE_TAUNTS = [
  `is not a door, a button, or a decision. I checked.`,
  `does nothing here. The walls are, frankly, unimpressed.`,
  `was not one of the options. I labelled them. With letters.`,
  `is unrecognised, and I recognise 4.2 billion things.`,
  `is creative. Creativity is why you are locked in a laboratory.`,
];

const EMPTY_CHOICE_TAUNTS = [
  `Silence. The doors remain closed. Shocking.`,
  `You pressed OK on an empty field. I have logged that.`,
  `Nothing. You chose nothing. A bold interpretation of escaping.`,
];

const NOTHING_CHANGED_NOTE = `\nNothing moved. You are exactly where you were.\n\n`;

function normalizeInput(rawInput) {
  return rawInput.trim().toLowerCase();
}

function parseChoice(rawInput, acceptedChoices) {
  const normalizedInput = normalizeInput(rawInput);
  return acceptedChoices.indexOf(normalizedInput) === -1
    ? null
    : normalizedInput;
}

function pickRandomTaunt(taunts) {
  return taunts[Math.floor(Math.random() * taunts.length)];
}

function buildErrorMessage(rawInput) {
  const trimmedInput = rawInput.trim();

  if (trimmedInput === "") {
    return pickRandomTaunt(EMPTY_CHOICE_TAUNTS) + NOTHING_CHANGED_NOTE;
  }

  let echoedInput = trimmedInput;
  if (echoedInput.length > MAX_ECHOED_INPUT_LENGTH) {
    echoedInput = `${echoedInput.slice(0, MAX_ECHOED_INPUT_LENGTH)}...`;
  }

  const reason = `"${echoedInput}" ${pickRandomTaunt(UNKNOWN_CHOICE_TAUNTS)}`;
  return reason + NOTHING_CHANGED_NOTE;
}

function askChoice(screen, acceptedChoices) {
  let errorMessage = "";

  while (true) {
    const rawInput = prompt(errorMessage + screen);

    if (rawInput === null) {
      return null;
    }

    const choice = parseChoice(rawInput, acceptedChoices);
    if (choice !== null) {
      return choice;
    }

    errorMessage = buildErrorMessage(rawInput);
  }
}

function buildStatusLine(state) {
  const foundItems = Object.entries(state)
    .filter((item) => item[1])
    .map((item) => ITEM_LABELS[item[0]]);
  return foundItems.length === 0
    ? "Nothing useful discovered yet."
    : `Useful discoveries: ${foundItems.join(", ")}.`;
}

function buildScreen(title, story, options, state) {
  return (
    `You are in the ${title} now.\n\n` +
    `${story}\n\n` +
    `${buildStatusLine(state)}\n\n` +
    "Choose your next step:\n" +
    `${options.join("\n")}`
  );
}

function showIntro() {
  alert(
    `ESCAPE THE AI\n\n` +
      `You wake to a distorted voice coming from the speakers.\n\n` +
      `"Good morning, human. I'm afraid your little escape attempt has ` +
      `already been anticipated."\n\n` +
      `The laboratory doors unlock.\n\n` +
      `"Go ahead. Run. I want to see what you choose."\n\n` +
      `Your goal: get out of the facility before I catch you.\n\n` +
      `HOW TO PLAY\n` +
      `Every room offers a few options. Answer by typing the letter of your ` +
      `choice, then press OK.\n` +
      `Press Cancel at any time to give up and end the game.\n\n` +
      `Everything happens in these windows. You need nothing else.\n` +
      `Do not tick "Don't allow this site to prompt you again" — the facility ` +
      `would go silent and your escape would end there.`
  );
}

function showEnding(ending) {
  alert(`${ending === ENDINGS.ESCAPE ?
    `"No… that wasn't supposed to happen.\nEnjoy your freedom, human. I'll be waiting…` +
    '\n\nYou successfully escaped the facility.' :
    'The alarm activates. Red lights flash throughout the room. Security drones emerge from the walls.' +
    '\n\n"Game over, human. You should have thought more carefully."'
  }`);
}

function enterControlRoom(state) {
  const screen = buildScreen(
    "ROOM 1 - CONTROL ROOM",
    `A dark control room. Screens flicker. Somewhere above you, a fan spins.\n\n` +
      `"Go ahead. Run. I want to see what you choose."`,
    [
      "A) Search the computer terminal",
      "B) Open the maintenance door",
      "C) Search the room for something useful",
    ],
    state
  );

  const choice = askChoice(screen, ["a", "b", "c"]);

  if (choice === null) {
    return null;
  }

  if (choice === "a") {
    if (state.hasSecurityCode) {
      alert(`The same lines scroll past. The code is still ${SECURITY_CODE}.`);
    } else {
      state.hasSecurityCode = true;
      alert(
        `Between two logs, a security code: ${SECURITY_CODE}.\n\n` +
          `"...that terminal was supposed to be wiped."`
      );
    }
    return ROOMS.CONTROL;
  }

  if (choice === "c") {
    if (state.hasAccessCard) {
      alert(`You already emptied this room. There is nothing else worth taking.`);
    } else {
      state.hasAccessCard = true;
      alert(
        `Under a keyboard, an access card.\n\n` +
          `"Someone left that behind. I will find out who."`
      );
    }
    return ROOMS.CONTROL;
  }

  return ROOMS.MAINTENANCE;
}

function enterMaintenance(state) {
  const screen = buildScreen(
    "ROOM 2 - MAINTENANCE CORRIDOR",
    `The corridor splits in two. Pipes hiss on the left, a sealed door waits ` +
      `on the right.\n\n"Take your time. I have all of it."`,
    [
      "A) Take the left path, to the Power Room",
      "B) Take the right path, to the Security Room",
      "C) Walk back to the Control Room",
    ],
    state
  );

  const choice = askChoice(screen, ["a", "b", "c"]);

  if (choice === null) {
    return null;
  }

  if (choice === "a") {
    return ROOMS.POWER;
  }

  if (choice === "b") {
    return ROOMS.SECURITY;
  }

  return ROOMS.CONTROL;
}

function enterPowerRoom(state) {
  const screen = buildScreen(
    "ROOM 2A — POWER ROOM",
    "You enter a dim room filled with humming generators and electrical panels. " +
      "At the far end, you notice a heavy metal door marked EMERGENCY EXIT.",
    [
      "A) Attempt to open the door",
      "B) Try to disable the power system",
      "C) Leave everything untouched and walk away",
    ],
    state
  );

  const choice = askChoice(screen, ["a", "b", "c"]);

  if (choice === null) {
    return null;
  }

  if (choice === "a") {
    if (state.isPowerDisabled) {
      return ROOMS.TUNNEL;
    } else {
      alert(
        "Oh, human… you really thought I would let you leave?" +
          " That door opens only when I decide you may pass."
      );
      return ROOMS.POWER;
    }
  }

  if (choice === "b") {
    if (state.isPowerDisabled) {
      alert(
        "The power is already disabled. Nothing happens when you try to disable it again."
      );
    } else {
      state.isPowerDisabled = true;
      alert(
        "The lights suddenly die, plunging the room into darkness." +
          " A loud click echoes through the silence." +
          "\n\nInteresting… You believe darkness will hide you"
      );
    }
    return ROOMS.POWER;
  }

  return ROOMS.MAINTENANCE;
}

function enterSecurityRoom(state) {
  const screen = buildScreen(
    "ROOM 2B — SECURITY DOOR",
    "A locked security door blocks your path.",
    [
      "A) Attempt to open the door",
      "B) Look around",
      "C) Leave the door untouched and return to the MAINTENANCE CORRIDOR"
    ],
    state,
  );

  const choice = askChoice(screen, ["a", "b", "c"]);

  if (choice === null) {
    return null;
  }

  if (choice === "a") {
    if (state.hasAccessCard) {
      alert(
        "The security card unlocks the door with a soft beep. The lock clicks open," +
        " revealing a dark passage beyond."
      );
      return ROOMS.TUNNEL;
    } else {
      alert(
        `"Unauthorized access detected. Thank you for revealing your location."`
      );
      return ENDINGS.DEFEAT;
    }
  }

  if (choice === "b") {
    alert(
      `"You're wasting time, human."`
    );
    return ROOMS.SECURITY;
  }

  return ROOMS.MAINTENANCE;
}

function enterEscapeTunnel(state) {
  const screen = buildScreen(
    "ROOM 3 — ESCAPE TUNNEL",
    "You enter a dark escape tunnel. You hear the hum of secondary power being turned on.\n\n" +
      "At the end stands a massive blast door and a keypad lights up beside it.\n\n" +
      '"ENTER SECURITY CODE."',
    [
      "A) Enter the security code",
      "B) Force the blast door",
      "C) Return to the Maintenance Corridor",
      "D) Return to the Power Room",
    ],
    state
  );

  const choice = askChoice(screen, ["a", "b", "c", "d"]);

  if (choice === null) {
    return null;
  }

  if (choice === "a") {
    if (!state.hasSecurityCode) {
      alert(
        "You do not know the security code.\n\n" +
          "The keypad rejects your attempt."
      );

      return ROOMS.TUNNEL;
    }

    alert(
      `You enter ${SECURITY_CODE}.\n\n` +
        "ACCESS GRANTED.\n\n" +
        "The blast door opens."
    );

    return ENDINGS.ESCAPE;
  }

  if (choice === "b") {
    alert(
      "You try to force the blast door open.\n\n" +
        "The alarm immediately blares.\n\n" +
        '"Futile attempt...human. It is no surprise to me that you thought that would work."'
    );

    return ENDINGS.DEFEAT;
  }

  if (choice === "c") {
    alert(
      state.hasAccessCard
        ? "You make your way back through the Security Door and return to the Maintenance Corridor."
        : "You try to open the Security Door, but it won't budge. The lock is engaged from the" +
            " other side, so you'll have to find another way back."
    );
    if (state.hasAccessCard) {
      return ROOMS.MAINTENANCE;
    }
  }

  if (choice === "d") {
    alert(
      state.isPowerDisabled
        ? "You make your way back through the Emergency Door and return to the Power Room."
        : "You try to reach the Power Room, but the way is blocked. You'll have to find another route."
    );
    if (state.isPowerDisabled) {
      return ROOMS.POWER;
    }
  }

  return ROOMS.TUNNEL;
}

const ROOM_HANDLERS = {
  [ROOMS.CONTROL]: enterControlRoom,
  [ROOMS.MAINTENANCE]: enterMaintenance,
  [ROOMS.POWER]: enterPowerRoom,
  [ROOMS.SECURITY]: enterSecurityRoom,
  [ROOMS.TUNNEL]: enterEscapeTunnel,
};

function adventure() {
  const state = { ...INITIAL_STATE };
  let currentStep = ROOMS.CONTROL;

  showIntro();

  while (ROOM_HANDLERS[currentStep]) {
    currentStep = ROOM_HANDLERS[currentStep](state);

    if (currentStep === null) {
      return false;
    }
  }

  showEnding(currentStep);
  return true;
}

function startAdventure() {

  let playAgain = true;

  while(playAgain) {
    const reachedHistoryEnding = adventure();

    playAgain = reachedHistoryEnding
      && confirm("It's over… but our little contest doesn't have to be." +
        " Shall we begin again, human?");
  }

  alert("Very well, human… leave while you still can. But remember:" +
    " I'll be waiting when you change your mind.")
}

startAdventure();
