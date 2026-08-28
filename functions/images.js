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

  const formatWitness = (w) => {
    const desc = w.description ? ` (${w.description})` : ''
    const outfit = w.outfit || 'colorful clothing'
    return `${w.name}${desc}, wearing ${outfit}`
  }

  const storyContext = context.crime ? `Mystery Case Context / Setting: ${context.crime}\n` : ''
  const themeContext = context.theme ? `Setting Theme / Tone: ${context.theme}\n` : ''

  const prompt = `A seamless 2x2 grid containing 4 distinct character portrait avatars in a unified colorful vector cartoon illustration style. All 4 characters must share a cohesive art style and fit the mystery story setting.
${storyContext}${themeContext}
Flat 2D digital art, full-bleed edge-to-edge illustrations, no outer frames, no white margins, no divider lines. No full-body or full-face portraits.
Close-up centered head-and-shoulders portrait filling each quadrant with expressive designs fitting the story:
- Top-Left quadrant: ${formatWitness(w0)}.
- Top-Right quadrant: ${formatWitness(w1)}.
- Bottom-Left quadrant: ${formatWitness(w2)}.
- Bottom-Right quadrant: ${formatWitness(w3)}.
Even 2x2 grid layout, 4 equal quadrants, vibrant colors.`

  // 1. Primary: gemini-3.1-flash-lite-image via generateContent with responseModalities: ['IMAGE']
  try {
    console.log('Generating 2x2 witness spritesheet using gemini-3.1-flash-lite-image...')
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
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
  } catch (liteErr) {
    console.warn(
      'gemini-3.1-flash-lite-image error, falling back to imagen-3.0:',
      liteErr?.message || liteErr,
    )
  }

  // 2. Fallback: imagen-3.0-generate-002
  try {
    console.log('Generating 2x2 witness spritesheet using imagen-3.0-generate-002 fallback...')
    const imgRes = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
        safetySettings,
      },
    })

    if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
      return imgRes.generatedImages[0].image.imageBytes
    }
  } catch (imgErr) {
    console.warn('imagen-3.0 fallback error:', imgErr?.message || imgErr)
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
