import { db } from '@/firebase'
import { ref as dbRef, update, serverTimestamp, get, child } from 'firebase/database'

/** @import {Story, GameSettings, ChatMessage} from '@/types.js' */

/**
 * Starts the game.
 * @param {string} gameId - The ID of the game.
 * @param {Story} caseFile
 * @param {any[]} witnesses - The array of witness objects.
 * @param {GameSettings} gameSettings - The game settings object.
 */
export async function startGame(gameId, caseFile, witnesses, gameSettings) {
  const gameRef = dbRef(db, `games/${gameId}`)
  await update(gameRef, {
    status: 'in-progress',
    story: caseFile,
    witnesses: witnesses,
    startTime: serverTimestamp(),
    duration: gameSettings.timeLimit,
  })
}

/**
 * Updates which team a witness is currently talking to.
 * @param {string} gameId - The ID of the game.
 * @param {string} witnessId - The ID of the witness (the 'id' property within the witness object).
 * @param {string | null} teamId - The ID of the team, or null if no team is talking to the witness.
 */
export async function updateWitnessTalkingTo(gameId, witnessId, teamId) {
  const gameRef = dbRef(db, `games/${gameId}`)
  const snapshot = await get(child(gameRef, 'witnesses'))
  const witnesses = snapshot.val()

  if (witnesses) {
    const witnessIndex = witnesses.findIndex((w) => w.id === witnessId)
    if (witnessIndex !== -1) {
      const witnessPath = `games/${gameId}/witnesses/${witnessIndex}`
      await update(dbRef(db, witnessPath), {
        talkingToTeamId: teamId,
      })
    } else {
      console.warn(`Witness with ID ${witnessId} not found in game ${gameId}.`)
    }
  } else {
    console.warn(`No witnesses found for game ${gameId}.`)
  }
}

/**
 * Fetches the chat history for a specific witness in a game, filtered by teamId.
 * @param {string} gameId - The ID of the game.
 * @param {string} witnessId - The ID of the witness.
 * @param {string} teamId - The ID of the team to filter the chat history by.
 * @returns {Promise<ChatHistoryItem[]>} - An array of chat messages belonging to the specified team.
 */
export async function getChatHistory(gameId, witnessId, teamId) {
  const chatRef = dbRef(db, `games/${gameId}/chats/${witnessId}`)
  const snapshot = await get(chatRef)
  const chatHistory = snapshot.val() || {}

  const filteredHistory = Object.keys(chatHistory)
    .filter(key => chatHistory[key].teamId === teamId)
    .map(key => ({
      id: key,
      ...chatHistory[key]
    }))

  return filteredHistory
}

/**
 * Clears the 'talkingToTeamId' for all witnesses in a given game.
 * This is used to reset the state on page load or when a game ends.
 * @param {string} gameId - The ID of the game.
 */
export async function clearAllWitnessTalkingTo(gameId) {
  const gameRef = dbRef(db, `games/${gameId}`)
  const snapshot = await get(child(gameRef, 'witnesses'))
  const witnesses = snapshot.val()

  if (witnesses) {
    const updates = {}
    witnesses.forEach((witness, index) => {
      if (witness.talkingToTeamId) {
        updates[`games/${gameId}/witnesses/${index}/talkingToTeamId`] = null
      }
    })
    if (Object.keys(updates).length > 0) {
      await update(dbRef(db), updates)
      console.log(`Cleared 'talkingToTeamId' for witnesses in game ${gameId}.`)
    }
  }
}
