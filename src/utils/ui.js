/**
 * Opens the presenter view window.
 * @param {string} gameId - The ID of the game.
 */
export function openPresenterWindow(gameId) {
  window.open(`/presenter/${gameId}`, '_blank');
}

/**
 * Formats a given number of seconds into a M:SS string.
 * @param {number} seconds - The total number of seconds.
 * @returns {string} - The formatted time string (e.g., "2:00", "0:30").
 */
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
  return `${minutes}:${formattedSeconds}`;
}
