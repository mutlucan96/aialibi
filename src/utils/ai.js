import { db } from '@/firebase'
import {
  ref as dbRef,
  set,
  push,
  serverTimestamp,
  get,
  onValue,
  off,
} from 'firebase/database'

/**
 * @import {Game, Story, GameSettings, Witness, ChatMessage} from '@/types.js'
 */

/**
 * Generates the story based on the settings via Realtime Database trigger to Cloud Functions (Firebase AI Logic).
 * @param {string} gameId - The ID of the game.
 * @param {GameSettings} newSettings - The game settings from the form.
 * @returns {Promise<{caseFile: Story, witnesses: Witness[]}>} Resolves with the case file and witnesses.
 */
export async function generateStory(gameId, newSettings) {
  const reqRef = dbRef(db, `games/${gameId}/storyRequest`)

  await set(reqRef, {
    status: 'pending',
    settings: { ...newSettings },
    requestedAt: serverTimestamp(),
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      off(reqRef)
      reject(new Error('Story generation timed out. Please try again.'))
    }, 90000)

    onValue(reqRef, async (snapshot) => {
      const data = snapshot.val()
      if (!data) return

      if (data.status === 'completed') {
        clearTimeout(timeout)
        off(reqRef)

        const gameSnap = await get(dbRef(db, `games/${gameId}`))
        const game = gameSnap.val() || {}
        const witnessesArray = Array.isArray(game.witnesses)
          ? game.witnesses
          : Object.values(game.witnesses || {})

        resolve({
          caseFile: game.story || {},
          witnesses: witnessesArray,
        })
      } else if (data.status === 'error') {
        clearTimeout(timeout)
        off(reqRef)
        reject(new Error(data.error || 'Failed to generate story'))
      }
    })
  })
}

/**
 * Generates portrait images for each witness via Realtime Database trigger to Cloud Functions (Firebase AI Logic).
 * @param {string} gameId - The ID of the game.
 * @param {Witness[]} witnesses - The array of witness objects.
 * @returns {Promise<Witness[]>} - The witnesses array with imageUrls.
 */
export async function generateImages(gameId, witnesses) {
  if (!witnesses || witnesses.length === 0) return []

  const reqRef = dbRef(db, `games/${gameId}/imageRequest`)

  await set(reqRef, {
    status: 'pending',
    requestedAt: serverTimestamp(),
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      off(reqRef)
      reject(new Error('Image generation timed out. Please try again.'))
    }, 120000)

    onValue(reqRef, async (snapshot) => {
      const data = snapshot.val()
      if (!data) return

      if (data.status === 'completed') {
        clearTimeout(timeout)
        off(reqRef)

        const witnessesSnap = await get(dbRef(db, `games/${gameId}/witnesses`))
        const updatedWitnesses = witnessesSnap.val() || []
        const witnessesArray = Array.isArray(updatedWitnesses)
          ? updatedWitnesses
          : Object.values(updatedWitnesses)
        resolve(witnessesArray)
      } else if (data.status === 'error') {
        clearTimeout(timeout)
        off(reqRef)
        reject(new Error(data.error || 'Failed to generate images'))
      }
    })
  })
}

/**
 * Interrogates a witness via Realtime Database trigger to Cloud Functions (Firebase AI Logic).
 * @param {string} gameId - The ID of the game.
 * @param {string} witnessId - The ID of the witness.
 * @param {string} messageText - The player's question text.
 * @param {string} teamId - The UID of the current team.
 * @param {(response: string) => void} onChunk - Callback receiving answer updates.
 * @param {() => void} onComplete - Callback when the AI has completed its response.
 * @param {(errorMessage: string) => void} [onError] - Optional callback when an error occurs.
 * @returns {Promise<void>}
 */
export async function sendChatMessage(
  gameId,
  witnessId,
  messageText,
  teamId,
  onChunk,
  onComplete,
  onError,
) {
  try {
    const chatsRef = dbRef(db, `games/${gameId}/chats/${witnessId}`)
    const newChatRef = push(chatsRef)

    await set(newChatRef, {
      teamId,
      question: messageText.trim(),
      status: 'pending',
      timestamp: serverTimestamp(),
    })

    const timeout = setTimeout(() => {
      off(newChatRef)
      if (onError) onError('Witness response timed out.')
      onComplete()
    }, 60000)

    onValue(newChatRef, (snapshot) => {
      const chat = snapshot.val()
      if (!chat) return

      if (chat.status === 'completed' && chat.answer) {
        clearTimeout(timeout)
        off(newChatRef)
        onChunk(chat.answer)
        onComplete()
      } else if (chat.status === 'error') {
        clearTimeout(timeout)
        off(newChatRef)
        if (onError) onError(chat.answer || 'Failed to interrogate witness.')
        onComplete()
      }
    })
  } catch (error) {
    console.error('Error sending chat message:', error)
    if (onError) onError(error.message || 'Failed to send question.')
    onComplete()
  }
}

/**
 * Evaluates an accusation via Realtime Database trigger to Cloud Functions (Firebase AI Logic).
 * @param {string} gameId - The ID of the game.
 * @param {string} culpritId - The ID of the accused witness.
 * @param {string} motive - The player's proposed motive.
 * @param {string} teamId - The UID of the current team.
 * @returns {Promise<boolean>} - Resolves to true if correct, false otherwise.
 */
export async function evaluateAccusation(gameId, culpritId, motive, teamId) {
  try {
    const accusationsRef = dbRef(db, `games/${gameId}/accusations`)
    const newAccusationRef = push(accusationsRef)

    await set(newAccusationRef, {
      teamId,
      culprit: culpritId,
      motive: motive.trim(),
      status: 'pending',
      timestamp: serverTimestamp(),
    })

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        off(newAccusationRef)
        resolve(false)
      }, 60000)

      onValue(newAccusationRef, (snapshot) => {
        const accusation = snapshot.val()
        if (!accusation) return

        if (accusation.status === 'evaluated') {
          clearTimeout(timeout)
          off(newAccusationRef)
          resolve(!!accusation.isCorrect)
        } else if (accusation.status === 'error') {
          clearTimeout(timeout)
          off(newAccusationRef)
          resolve(false)
        }
      })
    })
  } catch (error) {
    console.error('Error evaluating accusation:', error)
    return false
  }
}
