import { onValueWritten } from 'firebase-functions/v2/database'
import { randomUUID } from 'crypto'
import { db, storage, ai, DATABASE_INSTANCE, FUNCTIONS_REGION } from './config.js'

/**
 * Generates a 2x2 spritesheet containing portrait avatars for all 4 witnesses in a single AI call.
 * @param {Array<object>} witnesses - The array of 4 witness objects.
 * @param {object} [context] - Contextual information about the mystery case, crime, and settings.
 * @param {string} [context.crime] - Description of the crime.
 * @param {string} [context.theme] - Theme or setting request.
 * @param {string|number} [context.targetAge] - Target age for tone.
 * @returns {Promise<string|null>} Base64-encoded image data, or null on failure.
 */
async function generateWitnessSpritesheet(witnesses, context = {}) {
  const safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  ]

  const w0 = witnesses[0] || { name: 'Character 1', outfit: 'colorful clothing' }
  const w1 = witnesses[1] || { name: 'Character 2', outfit: 'colorful clothing' }
  const w2 = witnesses[2] || { name: 'Character 3', outfit: 'colorful clothing' }
  const w3 = witnesses[3] || { name: 'Character 4', outfit: 'colorful clothing' }

  const formatWitnessVisual = (w) => {
    const roleHint = w.description ? `representing a ${w.description}` : 'character'
    const outfit = w.outfit || 'distinct colorful attire'
    return `${roleHint}, dressed in ${outfit}`
  }

  const storyContext = context.crime
    ? `Mystery setting and case background context for inspiration: "${context.crime}"\n`
    : ''
  const themeContext = context.theme ? `Theme: "${context.theme}"\n` : ''

  const prompt = `A square 1:1 image containing a seamless 2x2 grid of 4 character portrait avatars in a unified colorful 2D vector cartoon illustration style.
${storyContext}${themeContext}
CRITICAL RULES:
1. STRICTLY NO TEXT: Do NOT include any names, words, letters, labels, titles, numbers, captions, watermarks, or text overlays anywhere in the image. This must be pure illustration without any writing. 
2. SQUARE 1:1 FORMAT: Exactly 4 equal square quadrants (2x2 grid) filling the entire 1:1 square canvas. No outer borders, no white margins, no frames, no divider lines.
3. CLOSE-UP HEAD-AND-SHOULDERS: Centered portraits. No full-body or full-face portraits.

Quadrants:
- Top-Left quadrant: ${formatWitnessVisual(w0)}.
- Top-Right quadrant: ${formatWitnessVisual(w1)}.
- Bottom-Left quadrant: ${formatWitnessVisual(w2)}.
- Bottom-Right quadrant: ${formatWitnessVisual(w3)}.

All 4 characters must share a cohesive 2D cartoon art style fitting the mystery setting. Vibrant colors.`

  // Generate 2x2 spritesheet using gemini-3.1-flash-lite-image
  try {
    console.log('Generating 2x2 witness spritesheet using gemini-3.1-flash-lite-image...')
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '512',
        },
        safetySettings,
      },
    })

    const candidate = response.candidates?.[0]
    const parts = candidate?.content?.parts || []
    for (const part of parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data
      }
    }
    console.warn(
      `gemini-3.1-flash-lite-image returned no inlineData. FinishReason: ${candidate?.finishReason}`,
    )
  } catch (error) {
    console.error(
      'Error generating image with gemini-3.1-flash-lite-image:',
      error?.message || error,
    )
  }

  return null
}

/**
 * RTDB Event Trigger: Generates a single 2x2 spritesheet for all 4 witnesses in 1 API call
 * and saves it to Firebase Storage with public download tokens.
 * Triggered on: /games/{gameId}/imageRequest
 */
export const onImageRequested = onValueWritten(
  {
    ref: '/games/{gameId}/imageRequest',
    instance: DATABASE_INSTANCE,
    region: FUNCTIONS_REGION,
    maxInstances: 5,
    timeoutSeconds: 120,
  },
  async (event) => {
    const { gameId } = event.params
    const requestData = event.data.after.val()

    if (!requestData || requestData.status !== 'pending') {
      return
    }

    const reqRef = db.ref(`games/${gameId}/imageRequest`)

    try {
      const gameSnap = await db.ref(`games/${gameId}`).once('value')
      const game = gameSnap.val() || {}
      const witnesses = game.witnesses
      const story = game.story || {}
      const settings = game.settings || {}

      if (!witnesses) {
        await reqRef.update({ status: 'completed' })
        return
      }

      const witnessesArray = Array.isArray(witnesses) ? witnesses : Object.values(witnesses)
      const bucket = storage.bucket()

      console.log(
        `Generating 2x2 spritesheet for ${witnessesArray.length} witnesses in 1 call (Game: ${gameId})`,
      )

      const base64Data = await generateWitnessSpritesheet(witnessesArray, {
        crime: story.crime || story.crimeDescription,
        theme: settings.theme,
        targetAge: settings.targetAge,
      })

      if (!base64Data) {
        const errorMsg = 'Image generation failed to return image data. Check Cloud Functions logs.'
        console.error(`Error in spritesheet image generation for game ${gameId}: ${errorMsg}`)
        await reqRef.update({
          status: 'error',
          error: errorMsg,
        })
        return
      }

      // Save the single 2x2 spritesheet file to Firebase Storage
      const filePath = `game-images/${gameId}/spritesheet_${Date.now()}.jpg`
      const file = bucket.file(filePath)
      const downloadToken = randomUUID()

      await file.save(Buffer.from(base64Data, 'base64'), {
        metadata: {
          contentType: 'image/jpeg',
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      })

      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`
      console.log(`2x2 spritesheet uploaded successfully for game ${gameId}: ${downloadURL}`)

      // Update all 4 witnesses with the shared spritesheet URL and their respective quadrant spriteIndex
      const updatedWitnesses = witnessesArray.map((witness, index) => ({
        ...witness,
        imageUrl: downloadURL,
        spriteIndex: index, // 0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right
      }))

      // Persist updated witnesses to Realtime Database
      await db.ref(`games/${gameId}/witnesses`).set(updatedWitnesses)

      await reqRef.update({ status: 'completed' })
      console.log(`All ${updatedWitnesses.length} witnesses updated with spritesheet.`)
    } catch (error) {
      console.error(`Error in spritesheet image generation for game ${gameId}:`, error)
      await reqRef.update({
        status: 'error',
        error: error.message,
      })
    }
  },
)
