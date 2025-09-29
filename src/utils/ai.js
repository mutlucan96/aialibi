import { db, auth } from '@/firebase'
import { ref as dbRef, set, update, push, serverTimestamp, get, child } from 'firebase/database'

/** @import {Game, Story, GameSettings, Witness, ChatMessage} from '@/types.js' */

import { ai } from '@/firebase'
import { getGenerativeModel, ResponseModality, Schema } from 'firebase/ai'
import { getGameById } from '@/utils/game-state.js'

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
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: storySchema,
    },
  })

  const prompt = `
    You are a master detective story writer. Based on the following game settings, create a compelling mystery case file.
    Game Settings:
    - Language Level: CEFR ${newSettings.languageLevel}
    - Target Age: ${newSettings.targetAge || 'any'}
    - Duration: ${newSettings.timeLimit || 'unlimited'} minutes
    - Target Vocabulary: ${newSettings.targetVocabulary || 'none'}
    - Additional Info: ${newSettings.theme || 'none'}
    Please return ONLY a valid JSON object with the following structure:
    {
      "crime": "A detailed description of the crime that was committed. It should also introduce witnesses since players will not see witness profiles. Also include some clues here.",
      "culprit": "The name of the witness who is the culprit.",
      "motive": "The culprit's reason for committing the crime.",
      "witnesses": [
        {
          "name": "Witness Name (max 2-3 words)",
          "personality": "A very detailed personality profile for the witness. This will be used by another AI to role-play as this character. Include their background, their relationship to the crime/victim, their personality, secrets, clues and how they might behave during an interrogation. This needs to be rich enough for an AI to generate dialogue from. It should include information about other witnesses and how they know them. It should also include possible questions that the player might ask and how they might answer, to help them solve the case.",
          "outfit": "A purely visual description of the character's appearance, suitable for an image generation prompt. If related (not necessary), include the character's gender, age, personality, expression, and any other relevant details that relates to physical appearance."
        },
        { "name": "...", "personality": "...", "outfit": "..." },
        { "name": "...", "personality": "...", "outfit": "..." },
        { "name": "...", "personality": "...", "outfit": "..." }
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
 * Sends a message to the AI and streams the response.
 * @param {string} gameId - The ID of the game.
 * @param {Game} game - The game settings.
 * @param {string} witnessId - The ID of the witness.
 * @param {string} messageText - The player's question.
 * @param {Witness} witnessProfile - The detailed personality profile of the witness.
 * @param {string} teamId - The ID of the current team.
 * @param {(chunk: string) => void} onChunk - Callback for each streamed chunk.
 * @param {() => void} onComplete - Callback when the stream is complete.
 * @returns {Promise<void>}
 */
export async function sendChatMessage(
  gameId,
  game,
  witnessId,
  messageText,
  witnessProfile,
  teamId,
  onChunk,
  onComplete,
) {
  const currentUser = auth.currentUser
  if (!currentUser) {
    console.error('No authenticated user found.')
    return
  }

  // Construct the Master "System Prompt"
  const gameRef = dbRef(db, `games/${gameId}`)
  const snapshot = await get(child(gameRef, `chats/${witnessId}`))
  const allChatHistory = snapshot.val() || {}

  let formattedChatHistory = ''
  for (const key in allChatHistory) {
    const chat = allChatHistory[key]
    // Include all chat messages for the witness in the prompt for the AI
    if (chat.question) {
      formattedChatHistory += `Team ${chat.teamId} asked: '${chat.question}'\n`
    }
    if (chat.answer) {
      formattedChatHistory += `You answered: '${chat.answer}'\n`
    }
  }

  const masterPrompt = `
    You are a witness in a detective game. 
    The game is about ${game.story.crimeDescription}.
    Your name is ${witnessProfile.name}. You are in this role: ${witnessProfile.personality}

    Rule 1: You must stay in character as your witness profile describes.
    Rule 2: Do not reveal that you are an AI.
    Rule 3: Do not reveal the final solution (the culprit or the motive).
    Rule 4: Do not directly reveal what other teams have asked you. But it is no secret other teams exists. If you are asked something similar to what other teams asked, you can refer to your previous answers. You can even mention it without revealing the actual question and the team's name.
    Rule 5: Answer in plain text, without any formatting. Do not use markdown or html tags.
    Rule 6: Do not add any additional descriptions (such as physical behaviours) to the response. The response should be only be consist of character's speech.
    Rule 7: Do not ask for follow-up questions.
    Rule 8: If defined, you appeal to ${game.settings.targetAge || 'any'} with CEFR ${game.settings.languageLevel || 'any'} language level.
    Rule 9: If defined, include these vocabulary if related: ${game.settings.targetVocabulary}.
    

    ${formattedChatHistory}
    Now, Team ${teamId} asks you: "${messageText}"
  `

  // Call the Gemini 2.5 Flash Model
  const chatModel = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash',
    generationConfig: {},
  })

  let aiResponse = ''
  const result = await chatModel.generateContentStream(masterPrompt)

  // Save the Player's Question to Firebase
  const chatRef = dbRef(db, `games/${gameId}/chats/${witnessId}`)
  const newChatMessageRef = await push(chatRef, {
    teamId: teamId,
    question: messageText,
    timestamp: serverTimestamp(),
  })
  const newChatKey = newChatMessageRef.key

  // Stream the AI's Answer to Firebase
  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    aiResponse += chunkText
    onChunk(chunkText)
  }

  // Save the AI's Answer to Firebase
  if (newChatKey) {
    const updatedChatRef = dbRef(db, `games/${gameId}/chats/${witnessId}/${newChatKey}`)
    await update(updatedChatRef, {
      answer: aiResponse,
    })
  }

  onComplete()
}

/**
 * Evaluates the player's accusation.
 * @param {string} gameId - The ID of the game.
 * @param {string} culpritId - The ID of the accused culprit.
 * @param {string} motive - The player's proposed motive.
 * @returns {Promise<boolean>} - True if the accusation is correct, false otherwise.
 */
export async function evaluateAccusation(gameId, culpritId, motive) {
  const game = await getGameById(gameId)
  if (!game || !game.story) {
    console.error('Game or story not found for accusation evaluation.')
    return false
  }

  const actualCulprit = game.story.culprit
  const actualMotive = game.story.motive

  const accusedWitness = game.witnesses.find((w) => w.id === culpritId)

  if (!accusedWitness) {
    console.error('Accused witness not found.')
    return false
  }

  // Check if the accused culprit's name matches the actual culprit's name
  const isCulpritCorrect = accusedWitness.name === actualCulprit

  // Use AI to evaluate the motive
  const model = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'text/plain',
    },
  })

  const prompt = `
    The crime was: "${game.story.crime}"
    The actual culprit is "${actualCulprit}" and their motive is "${actualMotive}".
    The player has accused "${accusedWitness.name}" with the motive: "${motive}".

    Is the player's motive for the accused culprit correct or close enough to the actual motive?
    Respond with ONLY "CORRECT" or "INCORRECT".
  `

  console.log('--- EVALUATING ACCUSATION PROMPT ---')
  console.log(prompt)

  const result = await model.generateContent(prompt)
  const aiEvaluation = result.response.text().trim().toUpperCase()
  console.log('--- ACCUSATION EVALUATION ---')
  console.log(aiEvaluation)

  const isMotiveCorrect = aiEvaluation === 'CORRECT'

  return isCulpritCorrect && isMotiveCorrect
}

/**
 * Generates images for each witness.
 * @param {any[]} witnesses - The array of witness objects.
 * @returns {Promise<any[]>} - The witnesses array with imageUrls.
 */
export async function generateImages(witnesses) {
  if (!witnesses || witnesses.length === 0) return []

  const model = getGenerativeModel(ai, {
    model: 'gemini-2.0-flash-preview-image-generation\n',
    generationConfig: {
      responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
    },
  })
  const updatedWitnesses = [...witnesses]

  for (let i = 0; i < updatedWitnesses.length; i++) {
    const witness = updatedWitnesses[i]
    const prompt = `Generate a cartoon style image of: ${witness.outfit}`
    console.log(`--- GENERATING IMAGE PROMPT for ${witness.name} ---`)
    console.log(prompt)

    try {
      const result = await model.generateContent(prompt)
      const inlineDataParts = result.response.inlineDataParts()
      if (inlineDataParts?.[0]) {
        const image = inlineDataParts[0].inlineData
        const imageUrl = `data:${image.mimeType};base64,${image.data}`
        console.log(`Generated image for ${witness.name}`)
        witness.imageUrl = imageUrl
      } else {
        console.error(`No image generated for ${witness.name}`)
        alert(`No image generated for ${witness.name}`)
      }
    } catch (err) {
      console.error(`Error generating image for ${witness.name}:`, err)
      alert(`Error generating image for ${witness.name}: ${err.message}`)
    }
  }
  return updatedWitnesses
}
