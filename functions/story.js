import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { SchemaType } from '@google/generative-ai'
import { db, genAI, FUNCTIONS_REGION } from './config.js'
import { assertGoogleAuth } from './utils/auth.js'

/**
 * Callable Function: Generates a complete mystery case file based on settings.
 * Gated to Google-authenticated moderators only.
 */
export const generateStory = onCall(
  {
    region: FUNCTIONS_REGION,
    maxInstances: 5,
    timeoutSeconds: 60,
    enforceAppCheck: true,
  },
  async (request) => {
    assertGoogleAuth(request)

    const { gameId, settings } = request.data
    if (!gameId || !settings) {
      throw new HttpsError('invalid-argument', 'gameId and settings are required.')
    }

    const storySchema = {
      type: SchemaType.OBJECT,
      properties: {
        crime: { type: SchemaType.STRING },
        clue: { type: SchemaType.STRING },
        culprit: { type: SchemaType.STRING },
        motive: { type: SchemaType.STRING },
        witnesses: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              personality: { type: SchemaType.STRING },
              outfit: { type: SchemaType.STRING },
            },
            required: ['name', 'personality', 'outfit'],
          },
        },
      },
      required: ['crime', 'clue', 'culprit', 'motive', 'witnesses'],
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.7-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: storySchema,
      },
    })

    const prompt = `
      You are a master detective story writer for an EFL (English as a Foreign Language) mystery classroom game.
      Create a compelling mystery case file suitable for English language learners.

      Game Settings:
      - CEFR Language Level: ${settings.languageLevel || 'B1'}
      - Target Age: ${settings.targetAge || 'any'}
      - Duration: ${settings.timeLimit || 'unlimited'} minutes
      - Target Vocabulary: ${settings.targetVocabulary || 'none'}
      - Theme / Additional Info: ${settings.theme || 'none'}

      Generate exactly 4 distinct witnesses. One of the witnesses MUST be the culprit.
      Ensure witness personalities contain rich details, relationships with other characters, and clues to discover during interrogation.
      Define a unified cartoonish / vector art style in the outfit description.
    `

    const result = await model.generateContent(prompt)
    const storyResponse = JSON.parse(result.response.text())

    const witnessesWithIds = storyResponse.witnesses.map((w) => ({
      ...w,
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    }))

    // Save generated story and witnesses to Realtime Database
    await db.ref(`games/${gameId}`).update({
      settings: { ...settings },
      story: storyResponse,
      witnesses: witnessesWithIds,
    })

    return { caseFile: storyResponse, witnesses: witnessesWithIds }
  },
)
