import { db } from '@/firebase'
import { ref as dbRef, update } from 'firebase/database'

/** @import {Story} from '@/types.js' */

/**
 * Starts the game.
 * @param {string} gameId - The ID of the game.
 * @param {Story} caseFile - The case file object.
 * @param {any[]} witnesses - The array of witness objects.
 */
export async function startGame(gameId, caseFile, witnesses) {
  const gameRef = dbRef(db, `games/${gameId}`)
  await update(gameRef, {
    status: 'in-progress',
    story: caseFile,
    witnesses: witnesses,
  })
}
