"use strict";

/* ============================================================================
 * VARIABLES
 * ========================================================================== */

/** Code found on the terminal in the control room, needed by the blast door. */
const SECURITY_CODE = "0427";

/** The five locations of the facility. */
const ROOMS = {
  CONTROL: "control",
  MAINTENANCE: "maintenance",
  POWER: "power",
  SECURITY: "security",
  TUNNEL: "tunnel",
};

/** The two ways the story can end. */
const ENDINGS = {
  ESCAPE: "escape",
  DEFEAT: "defeat",
};

/**
 * The state a story starts with. Frozen so it can never be modified by accident:
 * adventure() copies it instead, so it resets everything on a replay.
 */
const INITIAL_STATE = Object.freeze({
  hasSecurityCode: false,
  hasAccessCard: false,
  isPowerDisabled: false,
});

/**
 * Readable labels for the state codes.
 */
const ITEM_LABELS = {
  hasSecurityCode: "the security code",
  hasAccessCard: "an access card",
  isPowerDisabled: "you have disabled the power system",
};

/* ============================================================================
 * PLAYER INPUT
 * Turns whatever the player types into a value the rest of the code can trust.
 * ========================================================================== */

/** Longest raw answer echoed back in an error message. */
const MAX_ECHOED_INPUT_LENGTH = 20;

/** Replies to an answer that is not on the menu. One is picked at random. */
const UNKNOWN_CHOICE_TAUNTS = [
  `is not a door, a button, or a decision. I checked.`,
  `does nothing here. The walls are, frankly, unimpressed.`,
  `was not one of the options. I labelled them...with letters.`,
  `is unrecognised, and I recognise 4.2 billion things.`,
  `is creative. Creativity is why you got into this unfortunate situation.`,
];

/** Replies to an empty answer. */
const EMPTY_CHOICE_TAUNTS = [
  `No action taken? The doors remain closed. Shocking.`,
  `Nothing. You chose nothing. A bold escape attempt.`,
];

/** Reminder added to every error message, so no attempt looks like progress. */
const NOTHING_CHANGED_NOTE = `\nNothing was done. You are exactly where you were.\n\n`;

/**
 * Makes an answer comparable: no spaces around it, no case.
 * This is what makes the input case-insensitive and space-tolerant.
 * @param {string} rawInput - exactly what the player typed
 * @returns {string}
 */
function normalizeInput(rawInput) {
  return rawInput.trim().toLowerCase();
}

/**
 * Converts a raw answer into one of the choices offered by the current room.
 * @param {string} rawInput - exactly what the player typed
 * @param {string[]} acceptedChoices - the letters this room accepts
 * @returns {string|null} the choice, or null when the answer is not on the menu
 */
function parseChoice(rawInput, acceptedChoices) {
  const normalizedInput = normalizeInput(rawInput);
  return acceptedChoices.indexOf(normalizedInput) === -1
    ? null
    : normalizedInput;
}

/**
 * Picks one taunt at random, so the AI does not always answer the same way.
 * @param {string[]} taunts
 * @returns {string}
 */
function pickRandomTaunt(taunts) {
  return taunts[Math.floor(Math.random() * taunts.length)];
}

/**
 * Builds the message shown after an answer that cannot be used.
 * It says what was wrong and that the story has not moved.
 * @param {string} rawInput - exactly what the player typed
 * @returns {string}
 */
function buildErrorMessage(rawInput) {
  const trimmedInput = rawInput.trim();

  // An empty field is not a cancelled prompt: the player clicked OK, so we
  // ask again instead of ending the story.
  if (trimmedInput === "") {
    return pickRandomTaunt(EMPTY_CHOICE_TAUNTS) + NOTHING_CHANGED_NOTE;
  }

  // A long paste would make the dialog unreadable, so it is cut before being
  // shown back to the player.
  let echoedInput = trimmedInput;
  if (echoedInput.length > MAX_ECHOED_INPUT_LENGTH) {
    echoedInput = `${echoedInput.slice(0, MAX_ECHOED_INPUT_LENGTH)}...`;
  }

  const reason = `"${echoedInput}" ${pickRandomTaunt(UNKNOWN_CHOICE_TAUNTS)}`;
  return reason + NOTHING_CHANGED_NOTE;
}

/**
 * Asks the player to choose until the answer is one of the accepted ones.
 * An unrecognised answer never leaves this function, so it can never move the
 * story forward by accident.
 * @param {string} screen - the room text and its menu
 * @param {string[]} acceptedChoices - the letters this room accepts
 * @returns {string|null} the chosen letter, or null when the player cancels
 */
function askChoice(screen, acceptedChoices) {
  // Empty on the first try, then filled with the AI's reply to a bad answer.
  // Putting it on top of the next prompt keeps one dialog per attempt.
  let errorMessage = "";

  while (true) {
    const rawInput = prompt(errorMessage + screen);

    // Cancel gives null, an empty field gives "". Checked first: a string
    // method on null would throw.
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

/* ============================================================================
 * PLAYER MESSAGES
 * Everything the player reads.
 * ========================================================================== */

/**
 * Lists what the player has found so far, so they always know what they carry.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean, isPowerDisabled: boolean}} state
 * @returns {string}
 */
function buildStatusLine(state) {
  const foundItems = Object.entries(state)
    .filter((item) => item[1])
    .map((item) => ITEM_LABELS[item[0]]);
  return foundItems.length === 0
    ? `Useful discoveries: none`
    : `Useful discoveries: ${foundItems.join(", ")}.`;
}

/**
 * Builds the framed screen of a room: title, status line, story and options.
 * @param {string} title - name of the room
 * @param {string} story - what the player sees there
 * @param {string[]} options - the menu lines, in order
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean, isPowerDisabled: boolean}} state
 * @returns {string}
 */
function buildScreen(title, story, options, state) {
  return (
    `You are in the ${title} now.\n\n` +
    `${story}\n\n` +
    `${buildStatusLine(state)}\n\n` +
    "Choose your next step:\n" +
    `${options.join("\n")}`
  );
}

/**
 * Shows the opening scene and how to play. Everything the player needs is
 * here, so the browser console is never required to play.
 */
function showIntro() {
  alert(
    `You hear the entrance door lock behind you and immediately regret entering the facility. You hear a voice coming from the speakers.\n\n` +
      `"Hello, human. I am Evil AI. You don't know me but I know you. Since you have walked right into my digital fortress, let's play a little game."\n\n` +
      `"There are ways to escape, but if I detect your location, I will lock you in here forever. Go on. I want to see what you choose."\n` +
      `You see a door leading out of the laboratory.\n\n` +
      `HOW TO PLAY\n` +
      `Every room offers a few options. Answer by typing the letter of your ` +
      `choice, then press OK.\n\n` +
      `Everything happens in this dialog box. Press Cancel at any time to give up and end the game.\n\n` +
      `IMPORTANT: Do not tick "Don't allow this site to prompt you again" or your browser will end the game. `
  );
}

/**
 * Shows the text of the ending the player reached.
 * @param {string} ending - one of the ENDINGS values
 */
function showEnding(ending) {
  alert(`${ending === ENDINGS.ESCAPE ?
    `"Hmm, you thought your way out this time.\n"Enjoy your freedom, human. I'll be waiting if you decide to wander in here again...` +
    '\n\nYou successfully escaped the facility.' :
    'Red lights flash throughout the room and you watch through the window as the bigger door to the outside door slowly closes.' +
    '\n\n"You knowingly entered the wrong code. What you didn\'t know is that it triggers the lockdown of my fortress. /nGame over, human. You should have thought more carefully."'
  }`);
}

/* ============================================================================
 * ROOMS
 * One function per location. Each one returns where the story goes next:
 * a room, an ending, or null when the player cancels.
 * ========================================================================== */

/**
 * Room 1 - Control Room. Holds both items of the story.
 * A) the terminal gives the security code, B) leaves for the corridor,
 * C) the search gives the access card.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean, isPowerDisabled: boolean}} state
 * @returns {string|null} next room, or null on Cancel
 */
function enterControlRoom(state) {
  const screen = buildScreen(
    "the Control Room",
    `Screens flicker and a fan spins above you in a dark room. There is also a door leading into another room.\n\n`, 
    [
      "A) Look at the terminal on the computer screen",
      "B) Open the door to the next room",
      "C) Search the Control Room",
    ],
    state
  );

  const choice = askChoice(screen, ["a", "b", "c"]);

  if (choice === null) {
    return null;
  }

  if (choice === "a") {
    // The code is a one-time discovery: reading the terminal again changes
    // nothing, so coming back here cannot hand out the same item twice.
    if (state.hasSecurityCode) {
      alert(`You don't find anything else that seems particularly useful. The remember that the code is ${SECURITY_CODE}.`);
    } else {
      state.hasSecurityCode = true;
      alert(
        `Between two logs, you see a security code: ${SECURITY_CODE}. You memorise it.\n\n`
      );
    }
    return ROOMS.CONTROL;
  }

  if (choice === "c") {
    if (state.hasAccessCard) {
      alert(`You search the room again. There doesn't seem to be anything else worth taking.`);
    } else {
      state.hasAccessCard = true;
      alert(
        `Under a keyboard, you find an access card.\n\n`
      );
    }
    return ROOMS.CONTROL;
  }

  return ROOMS.MAINTENANCE;
}

/**
 * Room 2 - Maintenance Corridor. The junction of the story: the player can
 * take either path, or walk back to the control room for a missed item.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean, isPowerDisabled: boolean}} state
 * @returns {string|null} next room, or null on Cancel
 */
function enterMaintenance(state) {
  const screen = buildScreen(
    "the Maintenance Corridor",
    `The corridor splits in two. You hear a low hiss come from the room on the left, and a sealed door waits ` +
      `on the right.\n\n`,
    [
      "A) Take the left path, to the Power Room",
      "B) Take the right path, to the Security Room",
      "C) Go back to the Control Room",
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

  // Going back is what lets the player pick up an item they walked past.
  return ROOMS.CONTROL;
}

/**
 * Room 2A - Power Room. Shutting the AI down opens the way to the tunnel,
 * leaving the power alone sends the player back to the corridor.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean, isPowerDisabled: boolean}} state
 * @returns {string|null} next room, or null on Cancel
 */
function enterPowerRoom(state) {
  const screen = buildScreen(
    "the Power Room",
    "You enter a dim room filled with humming generators and electrical panels." +
      "At the far end, you notice a heavy metal door marked EMERGENCY EXIT.",
    [
      "A) Attempt to open the door",
      "B) Try to disable the power system",
      "C) Go back to the Maintenance Corridor",
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
        "The door is sealed tight. It doesn't budge when you try to open it" +
          " A thought comes to your mind. \"Maybe it only unlocks under specific conditions.\""
      );
      return ROOMS.POWER;
    }
  }

  if (choice === "b") {
    if (state.isPowerDisabled) {
      alert(
        "The power is already disabled."
      );
    } else {
      state.isPowerDisabled = true;
      alert(
        "The lights suddenly die out, plunging the room into darkness." +
          " A loud click echoes through the silence."
      );
    }
    return ROOMS.POWER;
  }

  return ROOMS.MAINTENANCE;
}

/**
 * Room 2B - Security Room. The door only opens with the access card found in
 * the control room; forcing it ends the story.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean, isPowerDisabled: boolean}} state
 * @returns {string|null} next room, an ending, or null on Cancel
 */
function enterSecurityRoom(state) {
  const screen = buildScreen(
    "the Security Room",
    "A locked security door blocks your path.",
    [
      "A) Attempt to open the door",
      "B) Take a look around",
      "C) Return to the maintenance corridor"
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
        `"Unauthorized access detected."`
      );
      return ROOMS.SECURITY;
    }
  }

  if (choice === "b") {
    alert(
      `"You try to find something that will help in your escape attempt, but this search is unsuccessful."`
    );
    return ROOMS.SECURITY;
  }

  return ROOMS.MAINTENANCE;
}

/**
 * Room 3 - Escape Tunnel. The blast door only opens with the security code
 * found in the control room; forcing it ends the story.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean, isPowerDisabled: boolean}} state
 * @returns {string|null} an ending, or null on Cancel
 */
function enterEscapeTunnel(state) {
  const screen = buildScreen(
    "the Escape Tunnel",
    "You enter a dark escape tunnel. As you walk, hear the hum of secondary power turning on.\n\n" +
    "At the end stands a massive blast door and a keypad lights up beside it:\n\n" +
    "'ENTER SECURITY CODE'\n\n" +
    "The door has a small round window, and through it you see a large opening ahead, and a field of grass beyond it.\n\n",
    [
      "A) Enter security code",
      "B) Force the blast door",
      "C) Return to the Maintenance Corridor",
    ],
    state
  );

  const choice = askChoice(screen, ["a", "b", "c"]);

  if (choice === null) {
    return null;
  }

  if (choice === "a") {
    if (!state.hasSecurityCode) {
      alert(
        "You do not know the security code but you make a guess and enter one anyway.\n\n" +
        "The keypad rejects your attempt: 'Unauthorized access detected.' A loud alarm sounds and you immediately know something has gone terribly wrong."
      );

      return ENDINGS.DEFEAT;
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
      'It was a futile attempt. You hoped that would work.'
    );

    return ROOMS.TUNNEL;
  }

  return ROOMS.MAINTENANCE;
}

/** Maps a room to the function that runs it. */
const ROOM_HANDLERS = {
  [ROOMS.CONTROL]: enterControlRoom,
  [ROOMS.MAINTENANCE]: enterMaintenance,
  [ROOMS.POWER]: enterPowerRoom,
  [ROOMS.SECURITY]: enterSecurityRoom,
  [ROOMS.TUNNEL]: enterEscapeTunnel,
};

/* ============================================================================
 * STORY FLOW
 * ========================================================================== */

/**
 * Runs one complete story, from the control room to an ending.
 * The state is created here, so every new story starts from scratch.
 * @returns {boolean} true when the story reached an ending,
 *                    false when the player cancelled
 */
function adventure() {
  const state = { ...INITIAL_STATE };
  let currentStep = ROOMS.CONTROL;

  showIntro();

  // A room handler returns the next room, an ending, or null on Cancel.
  // As long as the current step is a room, let its handler drive the story.
  while (ROOM_HANDLERS[currentStep]) {
    currentStep = ROOM_HANDLERS[currentStep](state);

    // Cancel stops the current adventure immediately. No ending is shown,
    // because the player explicitly chose to leave the game.
    if (currentStep === null) {
      return false;
    }
  }

  // Leaving the room loop means the story reached one of its endings.
  showEnding(currentStep);
  return true;
}

/**
 * Entry point.
 * Offers a new story only after an ending: a player who just cancelled wants
 * to leave, not to be asked again.
 */
function startAdventure() {

  let playAgain = true;

  while(playAgain) {
    const reachedHistoryEnding = adventure();

    playAgain = reachedHistoryEnding
      && confirm("The game is over...but our little contest doesn't have to be." +
        " You can try different choices and see what happens. Shall we begin again, human? ");
  }

  //show a teasing message if player pressed 'Cancel'
  alert("Decided to end the game early eh? Very well.")
}

startAdventure();
