import { onValueWritten } from 'firebase-functions/v2/database'
import { db, ai, DATABASE_INSTANCE, FUNCTIONS_REGION } from './config.js'

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

    const settings = requestData.settings || {}
    const reqRef = db.ref(`games/${gameId}/storyRequest`)

    try {
      const prompt = `
        You are an award-winning mystery writer creating an engaging, highly original detective game for English language learners (EFL).

        Game Settings:
        - CEFR Language Level: ${settings.languageLevel || 'B1'}
        - Target Age: ${settings.targetAge || 'any'}
        - Duration: ${settings.timeLimit || 'unlimited'} minutes
        - Target Vocabulary to naturally weave into the case: ${settings.targetVocabulary || 'none'}
        - Specific Theme / Setting Request: ${settings.theme || 'none'}
        
        Generate exactly 4 distinct witnesses. One of the witnesses MUST be the culprit.
        Ensure witness personalities contain rich details, relationships with other characters, and clues to discover during interrogation.
        Define a unified cartoonish / vector art style in the outfit description.
        
        CRIME DESCRIPTION: Write a vivid, detailed 3-5 sentence narrative. Clearly set the atmosphere, location, exact time of the crime, what valuable or strange object was stolen or sabotaged, the suspicious locked-room/event circumstances, and explain why only the 4 witnesses are the suspects.
        KEY CLUE: A specific, tangible clue left at the scene (e.g. a distinctive fabric fiber, a specific footprint, an odd scent, a dropped ticket with a timestamp, a peculiar tool) that subtly points to the culprit.
        WITNESSES (EXACTLY 4):
           - Each must have a distinct, memorable name and vivid occupation/role.
           - Rich personality with quirks, relationship to other characters, alibi, and motive suspicion.
           - Detailed outfit description in a vector cartoon illustration style (mention specific clothing, colors, distinctive hats/glasses/accessories) so it can be illustrated.
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
                  'Detailed 3-5 sentence narrative describing the crime, setting, and suspects.',
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
                    personality: { type: 'STRING' },
                    outfit: {
                      type: 'STRING',
                      description:
                        'Detailed vector cartoon outfit description with colors and accessories.',
                    },
                  },
                  required: ['name', 'personality', 'outfit'],
                },
              },
            },
            required: ['crime', 'clue', 'culprit', 'motive', 'witnesses'],
          },
        },
      })

      const responseText = response.text
      if (!responseText) {
        throw new Error(
          'AI returned an empty response. The request may have been blocked by safety filters.',
        )
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
