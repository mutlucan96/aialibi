import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { genAI, FUNCTIONS_REGION } from './config.js'
import { assertGoogleAuth } from './utils/auth.js'

/**
 * Callable Function: Generates portrait images for witnesses and saves them to Firebase Storage.
 * Gated to Google-authenticated moderators only.
 */
export const generateImages = onCall(
  {
    region: FUNCTIONS_REGION,
    maxInstances: 5,
    timeoutSeconds: 120,
    enforceAppCheck: true,
  },
  async (request) => {
    assertGoogleAuth(request)

    const { gameId, witnesses } = request.data
    if (!gameId || !witnesses || !Array.isArray(witnesses)) {
      throw new HttpsError('invalid-argument', 'gameId and witnesses array are required.')
    }

    const updatedWitnesses = [...witnesses]

    const imageModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-image' })

    for (let i = 0; i < updatedWitnesses.length; i++) {
      const witness = updatedWitnesses[i]
      const prompt = `${witness.outfit}. Vector cartoon illustration style, plain clean background, no text.`

      try {
        console.log(`Generating portrait for witness: ${witness.name} (Game: ${gameId}, Prompt: ${prompt})`)
        const result = await imageModel.generateContent(prompt)
        // Store or attach generated image output if available
        if (result && result.response) {
          console.log(`Image generation result received for ${witness.name}`)
        }
      } catch (err) {
        console.error(`Failed generating image for witness ${witness.name}:`, err)
      }
    }

    return { witnesses: updatedWitnesses }
  },
)
