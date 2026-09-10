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

/* ============================================================================
 * PLAYER INPUT
 * Turns whatever the player types into a value the rest of the code can trust.
 * ========================================================================== */

/**
 * Makes an answer comparable: no spaces around it, no case.
 * This is what makes the input case-insensitive and space-tolerant.
 * @param {string} rawInput - exactly what the player typed
 * @returns {string}
 */
function normalizeInput(rawInput) {
  // TODO
  return rawInput;
}

/**
 * Converts a raw answer into one of the choices offered by the current room.
 * @param {string} rawInput - exactly what the player typed
 * @param {string[]} acceptedChoices - the letters this room accepts
 * @returns {string|null} the choice, or null when the answer is not on the menu
 */
function parseChoice(rawInput, acceptedChoices) {
  // TODO
  return null;
}

/**
 * Builds the message shown after an answer that cannot be used.
 * It says what was wrong and that the story has not moved.
 * @param {string} rawInput - exactly what the player typed
 * @returns {string}
 */
function buildErrorMessage(rawInput) {
  // TODO
  return "";
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
  // TODO
  return null;
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
  // TODO
  return "";
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
  // TODO
  return "";
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
