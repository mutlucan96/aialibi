import { db } from '@/firebase';
import { ref as dbRef, remove, set } from 'firebase/database';

/**
 * Allows a player to join the lobby.
 * @param {string} gameId - The ID of the game.
 * @param {string} teamName - The team name.
 * @param {any} currentUser - The current user object.
 */
export async function joinLobby(gameId, teamName, currentUser) {
  if (!teamName || !currentUser) return;
  const teamId = currentUser.uid;
  const teamRef = dbRef(db, `games/${gameId}/teams/${teamId}`);
  await set(teamRef, {
    name: teamName,
    uid: currentUser.uid,
    score: 0,
  });
}

/**
 * Removes a team from the lobby.
 * @param {string} gameId - The ID of the game.
 * @param {string} teamId - The ID of the team to remove.
 */
export async function removeTeam(gameId, teamId) {
  const teamRef = dbRef(db, `games/${gameId}/teams/${teamId}`);
  await remove(teamRef);
}
