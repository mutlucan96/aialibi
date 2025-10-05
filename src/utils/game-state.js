import { db } from '@/firebase'
import { child, get, ref as dbRef, remove, serverTimestamp, set, update } from 'firebase/database'

/**
 * @import {Story, GameSettings, ChatMessage} from '@/types.js'
 * @import {User} from 'firebase/auth'
 */

/**
 * Starts the game.
 * @param {string} gameId - The ID of the game.
 * @param {Story} caseFile
 * @param {any[]} witnesses - The array of witness objects.
 * @param {GameSettings} gameSettings - The game settings object.
 * @param {User} currentUser - The current authenticated user.
 */
export async function startGame(gameId, caseFile, witnesses, gameSettings, currentUser) {
  const gameRef = dbRef(db, `games/${gameId}`)

  if (gameSettings.mode === 'classic') {
    const teamId = currentUser.uid
    const teamRef = dbRef(db, `games/${gameId}/teams/${teamId}`)
    await set(teamRef, {
      uid: teamId,
      name: 'Neutral Detective',
      color: '#212121',
      emoji: '🕵️‍',
      score: 0,
    })
  }

  await update(gameRef, {
    status: 'in-progress',
    story: caseFile,
    witnesses: witnesses,
    startTime: serverTimestamp(),
    duration: gameSettings.timeLimit,
  })
}

/**
 * Finishes the game.
 * @param {string} gameId - The ID of the game.
 */
export async function finishGame(gameId) {
  const gameRef = dbRef(db, `games/${gameId}`)
  await update(gameRef, {
    status: 'finished',
  })
}

/**
 * Removes the game from the database.
 * @param {string} gameId - The ID of the game.
 */
export async function removeGame(gameId) {
  const gameRef = dbRef(db, `games/${gameId}`)
  await remove(gameRef)
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
 * Records a correct accusation for a team in the game.
 * @param {string} gameId - The ID of the game.
 * @param {string} teamId - The ID of the team that made the correct accusation.
 */
export async function recordCorrectAccusation(gameId, teamId) {
  const gameRef = dbRef(db, `games/${gameId}`)
  const gameSnapshot = await get(gameRef)
  const gameData = gameSnapshot.val()

  if (!gameData) {
    console.error(`Game with ID ${gameId} not found.`)
    return
  }

  const team = gameData.teams[teamId]
  if (!team) {
    console.error(`Team with ID ${teamId} not found in game ${gameId}.`)
    return
  }

  const resultsRef = child(gameRef, 'results')
  const resultsSnapshot = await get(resultsRef)
  const existingResults = resultsSnapshot.val() || {}
  const placement = Object.keys(existingResults).length + 1

  const result = {
    teamName: team.name,
    color: team.color,
    emoji: team.emoji,
    finishTime: serverTimestamp(),
    placement: placement,
  }

  const updates = {}
  updates[`/games/${gameId}/results/${teamId}`] = result
  updates[`/games/${gameId}/teams/${teamId}/correctAccusation`] = true

  await update(dbRef(db), updates)
  console.log(`Team ${teamId} made a correct accusation in game ${gameId}.`)
}

/**
 * Fetches a game by its ID.
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<Game | null>} - The game object or null if not found.
 */
export async function getGameById(gameId) {
  const gameRef = dbRef(db, `games/${gameId}`)
  const snapshot = await get(gameRef)
  return snapshot.val()
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

  return Object.keys(chatHistory)
    .filter((key) => chatHistory[key].teamId === teamId)
    .map((key) => ({
      id: key,
      ...chatHistory[key],
    }))
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
