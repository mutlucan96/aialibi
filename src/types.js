/**
 * @typedef {Object} GameSettings
 * @property {('classic'|'race')} mode - The selected game mode.
 * @property {('A2'|'B1'|'B2'|'C1'|'C2')} languageLevel - The target language proficiency level.
 * @property {number|null} targetAge - The target age for the players.
 * @property {number} timeLimit - The time limit for the game in minutes (only for 'race' mode).
 * @property {string} targetVocabulary - Comma-separated list of vocabulary to include.
 * @property {string} theme - The theme or any additional info for the story generation.
 */

/**
 * @typedef {Object} Witness
 * @property {string} id - The unique ID of the witness.
 * @property {string} name - The name of the witness.
 * @property {string} imageUrl - The URL for the witness's image.
 */

/**
 * @typedef {Object} Story
 * @property {string} crimeDescription - The main description of the crime.
 * @property {Witness[]} witnesses - An array of witness objects.
 */

/**
 * @typedef {Object} Team
 * @property {string} name - The name of the team.
 * @property {string} uid - The unique ID of the user who created the team.
 * @property {number} score - The team's current score.
 * @property {string} emoji
 * @property {string} color
 * @property {string} talkingTo - The ID of the witness the team is currently talking to.
 */

/**
 * @typedef {Object} Game
 * @property {string} creatorId - The UID of the user who created the game.
 * @property {('lobby'|'in-progress'|'finished')} status - The current status of the game.
 * @property {number} createdAt - The timestamp when the game was created.
 * @property {string} joinCode - The 4-digit code for players to join a race mode game.
 * @property {Object.<string, Team>} [teams] - A dictionary of teams that have joined the game.
 * @property {Story} [story] - The generated story object for the game.
 * @property {GameSettings} [settings] - The settings object for the game.
 * @property {Witness[]} witnesses
 */

/**
 * @typedef {Object} ChatMessage
 * @property {('player'|'ai')} sender - The sender of the message.
 * @property {string} text - The content of the message.
 */

export {}
