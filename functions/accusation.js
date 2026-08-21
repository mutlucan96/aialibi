import { onValueCreated } from 'firebase-functions/v2/database'
import { db, genAI, ServerValue, DATABASE_INSTANCE, FUNCTIONS_REGION } from './config.js'

/**
 * RTDB Event Trigger: Handles player accusations.
 * Triggered on: /games/{gameId}/accusations/{accusationId}
 */
export const onAccusationCreated = onValueCreated(
  {
    ref: '/games/{gameId}/accusations/{accusationId}',
    instance: DATABASE_INSTANCE,
    region: FUNCTIONS_REGION,
    maxInstances: 5,
  },
  async (event) => {
    const { gameId, accusationId } = event.params
    const accusationData = event.data.val()

    if (!accusationData || accusationData.status !== 'pending') {
      return
    }

    const { teamId, culprit: accusedCulpritId, motive: proposedMotive } = accusationData
    const accusationRef = db.ref(`games/${gameId}/accusations/${accusationId}`)

    try {
      // 1. Fetch Game and Solution Data
      const gameSnap = await db.ref(`games/${gameId}`).once('value')
      const game = gameSnap.val()

      if (!game || !game.story) {
        await accusationRef.update({
          status: 'error',
          isCorrect: false,
          error: 'Game or story data not found.',
        })
        return
      }

      const actualCulprit = game.story.culprit
      const actualMotive = game.story.motive
      const witnessesArray = Array.isArray(game.witnesses)
        ? game.witnesses
        : Object.values(game.witnesses || {})

      const accusedWitness = witnessesArray.find((w) => w.id === accusedCulpritId)
      if (!accusedWitness) {
        await accusationRef.update({
          status: 'evaluated',
          isCorrect: false,
        })
        return
      }

      // 2. Verify culprit identity
      const isCulpritCorrect =
        accusedWitness.name.trim().toLowerCase() === actualCulprit.trim().toLowerCase()

      let isMotiveCorrect = false

      if (isCulpritCorrect) {
        // 3. Evaluate motive with gemini-3.7-flash
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.7-flash',
          generationConfig: { responseMimeType: 'text/plain' },
        })

        const prompt = `
          Crime Description: "${game.story.crime || ''}"
          Actual Culprit: "${actualCulprit}"
          Actual Motive: "${actualMotive}"
          Player Accused: "${accusedWitness.name}"
          Player's Proposed Motive: "${proposedMotive}"

          Evaluate whether the player's proposed motive is factually accurate or sufficiently close to the actual motive.
          Respond with ONLY "CORRECT" or "INCORRECT".
        `

        const result = await model.generateContent(prompt)
        const evaluationText = result.response.text().trim().toUpperCase()
        isMotiveCorrect = evaluationText.includes('CORRECT')
      }

      const isOverallCorrect = isCulpritCorrect && isMotiveCorrect

      // 4. Update Accusation Status
      await accusationRef.update({
        status: 'evaluated',
        isCorrect: isOverallCorrect,
      })

      // 5. If correct, record placement in RTDB
      if (isOverallCorrect) {
        const team = game.teams ? game.teams[teamId] : null
        if (team) {
          const resultsSnap = await db.ref(`games/${gameId}/results`).once('value')
          const existingResults = resultsSnap.val() || {}
          const placement = Object.keys(existingResults).length + 1

          const updates = {}
          updates[`games/${gameId}/results/${teamId}`] = {
            teamName: team.name,
            color: team.color,
            emoji: team.emoji,
            finishTime: ServerValue.TIMESTAMP,
            placement: placement,
          }
          updates[`games/${gameId}/teams/${teamId}/correctAccusation`] = true

          if (game.settings?.mode === 'classic') {
            updates[`games/${gameId}/status`] = 'finished'
          }

          await db.ref().update(updates)
        }
      }
    } catch (error) {
      console.error(`Error evaluating accusation ${accusationId}:`, error)
      await accusationRef.update({
        status: 'error',
        isCorrect: false,
        error: error.message,
      })
    }
  },
)
