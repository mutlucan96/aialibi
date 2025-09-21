/**
 * Opens the presenter view window.
 * @param {string} gameId - The ID of the game.
 */
export function openPresenterWindow(gameId) {
  window.open(`/presenter/${gameId}`, '_blank');
}
