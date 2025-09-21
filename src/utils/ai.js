import { db } from '@/firebase'
import { ref as dbRef, set, update } from 'firebase/database'

/** @import {Game, Story, GameSettings} from '@/types.js' */

/**
 * Generates the story based on the settings.
 * @param {string} gameId - The ID of the game.
 * @param {GameSettings} newSettings - The game settings from the form.
 * @returns {Promise<{caseFile: Story, witnesses: any[]}>}
 */
export async function generateStory(gameId, newSettings) {
  // Update game settings in Firebase right away
  const gameRef = dbRef(db, `games/${gameId}`)
  await update(gameRef, { settings: { ...newSettings }, story: null })

  const prompt = `
    You are a master detective story writer. Based on the following game settings, create a compelling mystery case file.
    Game Settings:
    - Mode: ${newSettings.mode}
    - Language Level: ${newSettings.languageLevel}
    - Target Age: ${newSettings.targetAge || 'any'}
    - Target Vocabulary: ${newSettings.targetVocabulary || 'none'}
    - Theme: ${newSettings.theme || 'classic detective story'}

    Please return ONLY a valid JSON object with the following structure:
    {
      "crime": "A detailed description of the crime that was committed.",
      "clue": "A single, crucial clue that(can help solve the case. This clue will be revealed later in the game.",
      "culprit": "The name of the witness who is the culprit.",
      "motive": "The culprit's reason for committing the crime.",
      "witnesses": [
        {
          "name": "Witness Name 1",
          "personality": "A very detailed personality profile for the witness. This will be used by another AI to role-play as this character. Include their background, their relationship to the crime/victim, their personality, secrets, and how they might behave during an interrogation. This needs to be rich enough for an AI to generate dialogue from.",
          "outfit": "A short (10-15 words), purely visual description of the character's appearance, suitable for an image generation prompt. Example: 'A friendly school gardener with a big hat and a watering can'."
        },
        { "name": "Witness Name 2", "personality": "...", "outfit": "..." },
        { "name": "Witness Name 3", "personality": "...", "outfit": "..." },
        { "name": "Witness Name 4", "personality": "...", "outfit": "..." }
      ]
    }
    Ensure the culprit's name is one of the four witness names.
  `

  console.log('--- GENERATING STORY PROMPT ---')
  console.log(prompt)

  await new Promise((resolve) => setTimeout(resolve, 2000))

  const mockApiResponse = {
    crime: `The world-renowned "Midnight Diamond" has been stolen from its display case at the Grand Museum Gala. The glass was cut with surgical precision, and the only thing left behind was a single, pristine white feather.`,
    clue: 'A small, almost invisible tear was found on the velvet cushion where the diamond once sat. It appears to be from a sharp, hooked object, not from the glass cutting.',
    culprit: 'Baroness Von Helsing',
    motive:
      'The Baroness is secretly a kleptomaniac from a fallen noble family. She stole the diamond to reclaim a piece of the lavish lifestyle she lost, driven by a compulsive desire for beautiful things.',
    witnesses: [
      {
        name: 'Baroness Von Helsing',
        personality:
          "The Baroness is an elderly, elegant woman, always dressed in vintage haute couture. She appears frail and speaks with a sophisticated, almost theatrical accent. She was a close friend of the museum curator and a major donor. Beneath her polished exterior, she is cunning and deeply resentful of her family's lost fortune. She might nervously fiddle with her pearl necklace when lying.",
        outfit:
          'An elegant, elderly aristocratic woman with sharp eyes, wearing a vintage black dress and a string of pearls. She looks slightly disdainful.',
      },
      {
        name: "Marco 'The Magician' Bellini",
        personality:
          "A charismatic and flamboyant stage magician hired as entertainment for the gala. He's charming, a bit of a show-off, and loves being the center of attention. He claims to have been performing a card trick at the exact moment of the theft. He is a master of misdirection and might have seen more than he lets on, but he's also afraid of getting involved with the police.",
        outfit:
          'A handsome, charismatic stage magician in his late 30s with a tuxedo and a top hat, holding a single playing card.',
      },
      {
        name: 'Dr. Alistair Finch',
        personality:
          "The museum's lead historian and gemologist. He's a quiet, academic man in his 50s, obsessed with the history of the diamond. He was the last person to check on the diamond before the gala began. He is precise, detail-oriented, and slightly socially awkward. He might seem nervous, but it's mostly because he feels responsible for the diamond's safety.",
        outfit:
          'A bookish, slightly disheveled male historian in his 50s, wearing a tweed jacket with elbow patches and glasses.',
      },
      {
        name: 'Fifi LaRoux',
        personality:
          "A young, ambitious journalist for a local gossip magazine who snuck into the gala. She's looking for a big scoop. She is bubbly, inquisitive, and not afraid to ask impertinent questions. She might have a photo or a piece of information that she doesn't realize is important, and she's eager to trade what she knows for a byline.",
        outfit:
          "A young, energetic female journalist with a determined look, holding a reporter's notebook and a vintage camera.",
      },
    ],
  }

  const witnesses = mockApiResponse.witnesses.map((w) => ({
    ...w,
    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
  }))

  const witnessesRef = dbRef(db, `games/${gameId}/witnesses`)
  await set(witnessesRef, witnesses)

  return { caseFile: mockApiResponse, witnesses }
}

/**
 * Generates images for each witness.
 * @param {any[]} witnesses - The array of witness objects.
 * @returns {Promise<any[]>} - The witnesses array with imageUrls.
 */
export async function generateImages(witnesses) {
  if (!witnesses || witnesses.length === 0) return []

  const updatedWitnesses = [...witnesses]

  for (let i = 0; i < updatedWitnesses.length; i++) {
    const witness = updatedWitnesses[i]
    const prompt = witness.outfit
    console.log(`--- GENERATING IMAGE PROMPT for ${witness.name} ---`)
    console.log(prompt)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newImageUrl = `https://picsum.photos/seed/${Math.random()}/512`
    console.log(`Generated image for ${witness.name}: ${newImageUrl}`)
    witness.imageUrl = newImageUrl
  }
  return updatedWitnesses
}
