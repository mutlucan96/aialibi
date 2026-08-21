import { onValueWritten } from 'firebase-functions/v2/database'
import { db, storage, genAI, DATABASE_INSTANCE, FUNCTIONS_REGION } from './config.js'

/**
 * RTDB Event Trigger: Generates portrait images for witnesses and saves them to Firebase Storage.
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
      const witnessesSnap = await db.ref(`games/${gameId}/witnesses`).once('value')
      const witnesses = witnessesSnap.val()

      if (!witnesses) {
        await reqRef.update({ status: 'completed' })
        return
      }

      const witnessesArray = Array.isArray(witnesses) ? witnesses : Object.values(witnesses)
      const updatedWitnesses = [...witnessesArray]

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
      await reqRef.update({ status: 'completed' })
    } catch (error) {
      console.error(`Error generating images for game ${gameId}:`, error)
      await reqRef.update({
        status: 'error',
        error: error.message,
      })
    }
  },
)
