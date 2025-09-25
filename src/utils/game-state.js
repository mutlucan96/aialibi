import { db } from '@/firebase'
import { ref as dbRef, update, serverTimestamp } from 'firebase/database'

/** @import {Story, GameSettings} from '@/types.js' */

/**
 * Starts the game.
 * @param {string} gameId - The ID of the game.
 * @param {Story} caseFile - The case file object.
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
