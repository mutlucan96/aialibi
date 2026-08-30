import { onValueWritten } from 'firebase-functions/v2/database'
import { db, ai, DATABASE_INSTANCE, FUNCTIONS_REGION } from './config.js'
import { checkDailyLimit, incrementDailyUsage } from './utils/limits.js'

/**
 * RTDB Event Trigger: Generates a complete mystery case file based on settings via Google GenAI.
 * Triggered on: /games/{gameId}/storyRequest
 */
export const onStoryRequested = onValueWritten(
  {
    ref: '/games/{gameId}/storyRequest',
    instance: DATABASE_INSTANCE,
    region: FUNCTIONS_REGION,
    maxInstances: 5,
    timeoutSeconds: 60,
  },
  async (event) => {
    const { gameId } = event.params
    const requestData = event.data.after.val()

    if (!requestData || requestData.status !== 'pending') {
      return
    }

    const reqRef = db.ref(`games/${gameId}/storyRequest`)

    try {
      const gameSnap = await db.ref(`games/${gameId}`).once('value')
      const game = gameSnap.val() || {}
      const creatorId = game.creatorId || requestData.creatorId || requestData.uid

      const limitCheck = await checkDailyLimit(creatorId, 'story')
      if (!limitCheck.allowed) {
        const errorMsg = limitCheck.reason || 'Daily story generation limit reached.'
        console.warn(
          `Story generation blocked for user ${creatorId} in game ${gameId}: ${errorMsg}`,
        )
        await reqRef.update({
          status: 'error',
          error: errorMsg,
        })
        return
      }

      const settings = requestData.settings || {}

      const prompt = `
        You are a master detective story writer. Based on the following game settings, create a compelling mystery case file for English language learners.

        Game Settings:
        - CEFR Language Level: ${settings.languageLevel || 'B1'}
        - Target Age: ${settings.targetAge || 'any'}
        - Duration: ${settings.timeLimit || 'unlimited'} minutes
        - Target Vocabulary to naturally weave into the case: ${settings.targetVocabulary || 'none'}
        - Specific Theme / Setting Request: ${settings.theme || 'none'}
        
        Generate exactly 4 distinct witnesses. One of the witnesses MUST be the culprit.
        Ensure witness personalities contain rich details, relationships with other characters, and clues to discover during interrogation.
        Define a unified cartoonish / vector art style in the outfit description.
        
        CRIME DESCRIPTION: A captivating description of the crime that was committed. Focus on the scene and what happened. Do NOT include witness introductions here as they have their own character cards. Also include some clues here.
        KEY CLUE: A specific, tangible clue left at the scene (e.g. a distinctive fabric fiber, a specific footprint, an odd scent, a dropped ticket with a timestamp, a peculiar tool) that subtly points to the culprit.
        WITNESSES (EXACTLY 4):
           - Each must have a distinct, memorable name and vivid occupation/role.
           - DESCRIPTION: A short, engaging 1-2 sentence public introduction (e.g., their job/role, connection to the scene, or why they are present) displayed on their witness card.
           - PERSONALITY: Rich secret personality profile with quirks, relationship to other characters, alibi, hidden secrets, and motive suspicion (used internally by the AI during interrogation).
           - OUTFIT: Visual description for character portrait generation.
        CULPRIT: Exactly one of the 4 witnesses MUST be the culprit. The 'culprit' string MUST match that witness's 'name' exactly.
        MOTIVE: A clear, plausible reason why the culprit committed the crime.
        Keep all English vocabulary accessible and suitable for ${settings.languageLevel || 'B1'} level.
      `

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              crime: {
                type: 'STRING',
                description:
                  'A description of the crime that was committed. Focus on the event, scene, and what happened without including full witness introductions.',
              },
              clue: {
                type: 'STRING',
                description: 'Tangible clue discovered at the crime scene.',
              },
              culprit: {
                type: 'STRING',
                description: 'The exact name of the witness who committed the crime.',
              },
              motive: {
                type: 'STRING',
                description: 'The reason why the culprit committed the crime.',
              },
              witnesses: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    description: {
                      type: 'STRING',
                      description:
                        'A short 1-2 introduction or background of the witness to be displayed on their character card. Do not include the name of the character. No full sentences. Short, concise and glancable descriptions.',
                    },
                    personality: {
                      type: 'STRING',
                      description:
                        'A very detailed personality profile for the witness. This will be used by another AI to role-play as this character. Include their background, their relationship to the crime/victim, their personality, secrets, clues and how they might behave during an interrogation. This needs to be rich enough for an AI to generate dialogue from. It should include information about other witnesses and how they know them. It should also include possible questions that the player might ask and how they might answer, to help them solve the case.',
                    },
                    outfit: {
                      type: 'STRING',
                      description:
                        "A purely visual description of the character's appearance, suitable for an image generation prompt. If related (not necessary), include the character's gender, age, personality, expression, and any other relevant details that relates to physical appearance. Also add a art style and theme and keep it same for every witness. Also define a specific detailed art style (avoid realistic) and keep it same for each witnesses to have a consistent style across witnesses",
                    },
                  },
                  required: ['name', 'description', 'personality', 'outfit'],
                },
              },
            },
            required: ['crime', 'clue', 'culprit', 'motive', 'witnesses'],
          },
        },
      })

      const responseText = response.text
      if (!responseText) {
        const errorMsg =
          'AI returned an empty response. The request may have been blocked by safety filters.'
        console.error(`Error generating story for game ${gameId}: ${errorMsg}`)
        await reqRef.update({
          status: 'error',
          error: errorMsg,
        })
        return
      }
      const storyResponse = JSON.parse(responseText)

      const witnessesWithIds = storyResponse.witnesses.map((w) => ({
        ...w,
        id:
          Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      }))

      // Save generated story and witnesses to Realtime Database
      await db.ref(`games/${gameId}`).update({
        settings: { ...settings },
        story: storyResponse,
        witnesses: witnessesWithIds,
      })

      // Increment daily story usage
      await incrementDailyUsage(creatorId, 'story')

      await reqRef.update({
        status: 'completed',
      })
    } catch (error) {
      console.error(`Error generating story for game ${gameId}:`, error)
      await reqRef.update({
        status: 'error',
        error: error.message,
      })
    }
  },
)
