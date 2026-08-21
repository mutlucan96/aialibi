import { db, functions } from '@/firebase'
import { ref as dbRef, push, onValue, serverTimestamp, off } from 'firebase/database'
import { httpsCallable } from 'firebase/functions'

/**
 * @import {Game, Story, GameSettings, Witness, ChatMessage} from '@/types.js'
 */

/**
 * Generates the story based on the settings via a secure Cloud Function.
 * @param {string} gameId - The ID of the game.
 * @param {GameSettings} newSettings - The game settings from the form.
 * @returns {Promise<{caseFile: Story, witnesses: Witness[]}>}
 * @throws {Error} Throws if Cloud Function fails or user lacks Google Auth.
 */
export async function generateStory(gameId, newSettings) {
  const generateStoryFn = httpsCallable(functions, 'generateStory')
  const result = await generateStoryFn({
    gameId,
    settings: { ...newSettings },
  })

  const { caseFile, witnesses } = /** @type {{caseFile: Story, witnesses: Witness[]}} */ (
    result.data
  )
  return { caseFile, witnesses }
}

/**
 * Generates images for each witness via a secure Cloud Function.
 * @param {string} gameId - The ID of the game.
 * @param {Witness[]} witnesses - The array of witness objects.
 * @returns {Promise<Witness[]>} - The witnesses array with imageUrls.
 * @throws {Error} Throws if image generation fails.
 */
export async function generateImages(gameId, witnesses) {
  if (!witnesses || witnesses.length === 0) return []

  const generateImagesFn = httpsCallable(functions, 'generateImages')
  const result = await generateImagesFn({
    gameId,
    witnesses: [...witnesses],
  })

  const { witnesses: updatedWitnesses } = /** @type {{witnesses: Witness[]}} */ (result.data)
  return updatedWitnesses || witnesses
}

/**
 * Sends a player's question to a witness via Realtime Database and listens for the AI's response.
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
  const chatRef = dbRef(db, `games/${gameId}/chats/${witnessId}`)

  // Push question to RTDB with 'pending' status to trigger server Cloud Function
  const newChatMessageRef = await push(chatRef, {
    teamId: teamId,
    question: messageText.trim(),
    status: 'pending',
    timestamp: serverTimestamp(),
  })

  const chatKey = newChatMessageRef.key
  if (!chatKey) return

  const singleChatRef = dbRef(db, `games/${gameId}/chats/${witnessId}/${chatKey}`)

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      off(singleChatRef)
      if (onError) onError('Request timed out. Please try again.')
      onComplete()
      resolve()
    }, 35000)

    const unsubscribe = onValue(singleChatRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) return

      if (data.answer) {
        onChunk(data.answer)
      }

      if (data.status === 'completed') {
        clearTimeout(timeoutId)
        unsubscribe()
        onComplete()
        resolve()
      } else if (data.status === 'error') {
        clearTimeout(timeoutId)
        unsubscribe()
        if (onError) onError(data.answer || 'Failed to receive answer.')
        onComplete()
        resolve()
      }
    })
  })
}

/**
 * Submits an accusation to Realtime Database and awaits evaluation from the server Cloud Function.
 * @param {string} gameId - The ID of the game.
 * @param {string} culpritId - The ID of the accused witness.
 * @param {string} motive - The player's proposed motive.
 * @param {string} teamId - The UID of the current team.
 * @returns {Promise<boolean>} - Resolves to true if the accusation is correct, false otherwise.
 */
export async function evaluateAccusation(gameId, culpritId, motive, teamId) {
  const accusationsRef = dbRef(db, `games/${gameId}/accusations`)

  const newAccusationRef = await push(accusationsRef, {
    teamId: teamId,
    culprit: culpritId,
    motive: motive.trim(),
    status: 'pending',
    timestamp: serverTimestamp(),
  })

  const accusationKey = newAccusationRef.key
  if (!accusationKey) return false

  const singleAccusationRef = dbRef(db, `games/${gameId}/accusations/${accusationKey}`)

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      off(singleAccusationRef)
      resolve(false)
    }, 30000)

    const unsubscribe = onValue(singleAccusationRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) return

      if (data.status === 'evaluated') {
        clearTimeout(timeoutId)
        unsubscribe()
        resolve(data.isCorrect === true)
      } else if (data.status === 'error') {
        clearTimeout(timeoutId)
        unsubscribe()
        resolve(false)
      }
    })
  })
}
