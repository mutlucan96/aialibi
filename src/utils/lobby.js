import { db } from '@/firebase'
import { ref as dbRef, remove, set } from 'firebase/database'

/**
 * Allows a player to join the lobby with team name, color, and emoji.
 * @param {string} gameId - The ID of the game.
 * @param {{name: string, color?: string, emoji?: string} | string} teamData - The team data or team name.
 * @param {any} currentUser - The current user object.
 * @returns {Promise<void>}
 */
export async function joinLobby(gameId, teamData, currentUser) {
  if (!teamData || !currentUser) return
  const teamId = currentUser.uid
  const teamRef = dbRef(db, `games/${gameId}/teams/${teamId}`)

  const name = typeof teamData === 'string' ? teamData : teamData.name
  const color = typeof teamData === 'object' && teamData.color ? teamData.color : '#1E88E5'
  const emoji = typeof teamData === 'object' && teamData.emoji ? teamData.emoji : '🕵️'

  await set(teamRef, {
    name,
    uid: currentUser.uid,
    color,
    emoji,
    score: 0,
  })
}

/**
 * Removes a team from the lobby.
 * @param {string} gameId - The ID of the game.
 * @param {string} teamId - The ID of the team to remove.
 */
export async function removeTeam(gameId, teamId) {
  const teamRef = dbRef(db, `games/${gameId}/teams/${teamId}`)
  await remove(teamRef)
}
