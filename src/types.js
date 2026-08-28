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
 * @property {string} [description] - A short 1-2 sentence public introduction or role displayed on the witness card.
 * @property {string} imageUrl - The URL for the witness's image or spritesheet.
 * @property {number} [spriteIndex] - The quadrant index (0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right) if using a 2x2 spritesheet.
 * @property {string} personality - The personality of the witness.
 * @property {string} outfit - The outfit of the witness.
 * @property {string} talkingToTeamId - The ID of the team that is currently talking to the witness.
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
 * @property {Object.<string, Team>} teams - A dictionary of teams that have joined the game.
 * @property {CaseFile} [caseFile] - The generated case file for the game.
 * @property {Story} [story] - The generated story for the game.
 * @property {GameSettings} [settings] - The settings object for the game.
 * @property {Witness[]} witnesses
 * @property {number} [startTime]
 * @property {number} [duration]
 * @property {Team[]} teams
 * @property {Results} results
 */

/**
 * @typedef {Object} ChatMessage
 * @property {('player'|'ai')} sender - The sender of the message.
 * @property {string} text - The content of the message.
 */

/**
 * @typedef {Object} ChatHistoryItem
 * @property {string} id - The unique ID of the chat message in Firebase.
 * @property {string} teamId - The ID of the team that sent the question.
 * @property {string} question - The question asked by the team.
 * @property {string} [answer] - The AI's answer to the question.
 * @property {Object} timestamp - Server timestamp object.
 */

/**
 * @typedef {Object} Result
 * @property {number} placement - The placement of the team.
 * @property {string} teamName - The name of the team.
 * @property {string} color - The color of the team.
 * @property {string} emoji - The emoji of the team.
 * @property {number} finishTime - The finish time of the team.
 */

/**
 * @typedef {Object} Results
 * @property {Object.<string, Result>} results - A dictionary of results.
 */

/**
 * @typedef {Object} CaseFile
 * @property {string} crime - The main description of the crime.
 * @property {string} culprit - The culprit of the crime.
 * @property {string} motive - The motive of the crime.
 * @property {Witness[]} witnesses - An array of witness objects.
 */

/**
 * @typedef {Object} AccusationRequest
 * @property {string} teamId - The UID of the team making the accusation.
 * @property {string} culprit - The ID of the accused witness.
 * @property {string} motive - The proposed motive.
 * @property {('pending'|'evaluated'|'error')} status - The status of the evaluation.
 * @property {boolean} [isCorrect] - Whether the accusation was correct.
 * @property {Object} timestamp - Server timestamp object.
 */

/**
 * @typedef {Object} BlockedUser
 * @property {Object} bannedAt - Server timestamp when user was banned.
 * @property {string} reason - The reason for the ban.
 */

export {}


