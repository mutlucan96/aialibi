import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, storage, genAI, FUNCTIONS_REGION } from './config.js'
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
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-image',
      generationConfig: {
        // @ts-ignore
        responseModalities: ['IMAGE'],
      },
    })

    const bucket = storage.bucket()

    for (let i = 0; i < updatedWitnesses.length; i++) {
      const witness = updatedWitnesses[i]
      const prompt = `${witness.outfit}. Vector cartoon illustration style, plain clean background, no text.`

      try {
        console.log(
          `Generating portrait for witness: ${witness.name} (Game: ${gameId}, Prompt: ${prompt})`,
        )
        const result = await model.generateContent(prompt)

        let imageBuffer = null
        if (result.response && result.response.candidates && result.response.candidates[0]) {
          const parts = result.response.candidates[0].content?.parts || []
          const imagePart = parts.find((p) => p.inlineData && p.inlineData.data)
          if (imagePart) {
            imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
          }
        }

        if (imageBuffer) {
          const filePath = `game-images/${gameId}/${witness.id}.jpg`
          const file = bucket.file(filePath)

          await file.save(imageBuffer, {
            metadata: {
              contentType: 'image/jpeg',
            },
          })

          const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`
          witness.imageUrl = downloadURL
          console.log(
            `Successfully generated and uploaded image for ${witness.name}: ${downloadURL}`,
          )
        } else {
          console.warn(`No image data returned from model for witness ${witness.name}`)
        }
      } catch (err) {
        console.error(`Failed generating image for witness ${witness.name}:`, err)
      }
    }

    // Save updated witnesses with imageUrls to Realtime Database
    await db.ref(`games/${gameId}/witnesses`).set(updatedWitnesses)

    return { witnesses: updatedWitnesses }
  },
)
