import { db } from '@/firebase'
import { ref as dbRef, set, update } from 'firebase/database'

/** @import {Game, Story, GameSettings} from '@/types.js' */

import { ai } from '@/firebase'
import { getGenerativeModel, Schema } from 'firebase/ai'

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

  const storySchema = Schema.object({
    properties: {
      crime: Schema.string(),
      clue: Schema.string(),
      culprit: Schema.string(),
      motive: Schema.string(),
      witnesses: Schema.array({
        items: Schema.object({
          properties: {
            name: Schema.string(),
            personality: Schema.string(),
            outfit: Schema.string(),
          },
        }),
      }),
    },
  })

  const model = getGenerativeModel(ai, {
    model: 'gemini-2.5-pro',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: storySchema,
    },
  })

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

  const result = await model.generateContent(prompt)
  const storyResponse = JSON.parse(result.response.text())
  console.log('--- STORY RESPONSE ---')
  console.log(storyResponse)

  const witnesses = storyResponse.witnesses.map((w) => ({
    ...w,
    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
  }))

  const witnessesRef = dbRef(db, `games/${gameId}/witnesses`)
  await set(witnessesRef, witnesses)

  return { caseFile: storyResponse, witnesses }
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
