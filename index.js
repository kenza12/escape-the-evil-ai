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
 * State a story starts with. Frozen so it can never be modified by accident:
 * adventure() copies it instead, which is what resets everything on a replay.
 */
const INITIAL_STATE = Object.freeze({
  hasSecurityCode: false,
  hasAccessCard: false,
});

/**
 * Readable labels for the state codes.
 */
const ITEM_LABELS = {
  hasSecurityCode: "the security code",
  hasAccessCard: "an access card",
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
  `was not one of the options. I labelled them. With letters.`,
  `is unrecognised, and I recognise 4.2 billion things.`,
  `is creative. Creativity is why you are locked in a laboratory.`,
];

/** Replies to an empty answer. */
const EMPTY_CHOICE_TAUNTS = [
  `Silence. The doors remain closed. Shocking.`,
  `You pressed OK on an empty field. I have logged that.`,
  `Nothing. You chose nothing. A bold interpretation of escaping.`,
];

/** Reminder added to every error message, so no attempt looks like progress. */
const NOTHING_CHANGED_NOTE = `\nNothing moved. You are exactly where you were.\n\n`;

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
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean}} state
 * @returns {string}
 */
function buildStatusLine(state) {
  const foundItems = Object.entries(state)
    .filter((item) => item[1])
    .map((item) => ITEM_LABELS[item[0]]);
  return foundItems.length === 0
    ? "Nothing useful discovered yet."
    : `Useful discoveries: ${foundItems.join(", ")}.`;
}

/**
 * Builds the framed screen of a room: title, status line, story and options.
 * @param {string} title - name of the room
 * @param {string} story - what the player sees there
 * @param {string[]} options - the menu lines, in order
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean}} state
 * @returns {string}
 */
function buildScreen(title, story, options, state) {
  return (
    `You are in the ${title} now.\n` +
    `${story}\n` +
    `${buildStatusLine(state)}\n` +
    "Choose your next step:\n" +
    `${options.join("\n")}`
  );
}

/**
 * Shows the opening scene and how to play. Everything the player needs is
 * here, so the browser console is never required to play.
 */
function showIntro() {
  // TODO
}

/**
 * Shows the text of the ending the player reached.
 * @param {string} ending - one of the ENDINGS values
 */
function showEnding(ending) {
  // TODO
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
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean}} state
 * @returns {string|null} next room, or null on Cancel
 */
function enterControlRoom(state) {
  // TODO
  return null;
}

/**
 * Room 2 - Maintenance Corridor. The junction of the story: the player can
 * take either path, or walk back to the control room for a missed item.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean}} state
 * @returns {string|null} next room, or null on Cancel
 */
function enterMaintenance(state) {
  // TODO
  return null;
}

/**
 * Room 2A - Power Room. Shutting the AI down opens the way to the tunnel,
 * leaving the power alone sends the player back to the corridor.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean}} state
 * @returns {string|null} next room, or null on Cancel
 */
function enterPowerRoom(state) {
  // TODO
  return null;
}

/**
 * Room 2B - Security Room. The door only opens with the access card found in
 * the control room; forcing it ends the story.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean}} state
 * @returns {string|null} next room, an ending, or null on Cancel
 */
function enterSecurityRoom(state) {
  // TODO
  return null;
}

/**
 * Room 3 - Escape Tunnel. The blast door only opens with the security code
 * found in the control room; forcing it ends the story.
 * @param {{hasSecurityCode: boolean, hasAccessCard: boolean}} state
 * @returns {string|null} an ending, or null on Cancel
 */
function enterEscapeTunnel(state) {
  // TODO
  return null;
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

  // TODO
  return false;
}

/**
 * Entry point.
 * Offers a new story only after an ending: a player who just cancelled wants
 * to leave, not to be asked again.
 */
function startAdventure() {
  // TODO
}

startAdventure();
