import { onValueCreated } from 'firebase-functions/v2/database'
import { db, genAI, DATABASE_INSTANCE, FUNCTIONS_REGION } from './config.js'
import { banUserGlobally, isRateLimited, recordUserActivity } from './utils/moderation.js'

/**
 * RTDB Event Trigger: Handles witness interrogation questions created by players.
 * Triggered on: /games/{gameId}/chats/{witnessId}/{chatId}
 */
export const onChatCreated = onValueCreated(
  {
    ref: '/games/{gameId}/chats/{witnessId}/{chatId}',
    instance: DATABASE_INSTANCE,
    region: FUNCTIONS_REGION,
    maxInstances: 10,
  },
  async (event) => {
    const { gameId, witnessId, chatId } = event.params
    const chatData = event.data.val()

    if (!chatData || !chatData.question || chatData.answer || chatData.status !== 'pending') {
      return
    }

    const teamId = chatData.teamId
    const chatRef = db.ref(`games/${gameId}/chats/${witnessId}/${chatId}`)

    try {
      // 1. Abuse & Rate-limit verification
      if (await isRateLimited(gameId, teamId)) {
        await banUserGlobally(teamId, 'Rate limit violation (spamming witness chat)')
        await chatRef.update({
          status: 'error',
          answer: 'You have been permanently blocked due to rate limit violation.',
        })
        return
      }

      await recordUserActivity(gameId, teamId)

      // 2. Fetch Game Data and Witness Profile
      const gameSnap = await db.ref(`games/${gameId}`).once('value')
      const game = gameSnap.val()

      if (!game || !game.story || !game.witnesses) {
        await chatRef.update({
          status: 'error',
          answer: 'Game data or witness profile is unavailable.',
        })
        return
      }

      const witnessesArray = Array.isArray(game.witnesses)
        ? game.witnesses
        : Object.values(game.witnesses)

      const witnessProfile = witnessesArray.find((w) => w.id === witnessId)
      if (!witnessProfile) {
        await chatRef.update({
          status: 'error',
          answer: 'Witness profile not found.',
        })
        return
      }

      // 3. Format Witness Chat History
      const allChatsSnap = await db.ref(`games/${gameId}/chats/${witnessId}`).once('value')
      const allChats = allChatsSnap.val() || {}

      const formattedChatHistory = Object.keys(allChats)
        .filter((key) => key !== chatId)
        .map((key) => allChats[key])
        .filter((chat) => chat && chat.question && chat.answer)
        .map(
          (chat) =>
            `Team ${chat.teamId} asked: '${chat.question}'\nYou answered: '${chat.answer}'`,
        )
        .join('\n')

      const crimeDescription = game.story.crime || game.story.crimeDescription || ''
      const languageLevel = game.settings?.languageLevel || 'B1'
      const targetAge = game.settings?.targetAge || 'any'
      const targetVocabulary = game.settings?.targetVocabulary || 'none'

      const masterPrompt = `
        You are a witness in an EFL classroom detective game. 
        The game is about: ${crimeDescription}.
        Your name is ${witnessProfile.name}. You are in this role: ${witnessProfile.personality}

        Rule 1: You must stay in character as your witness profile describes.
        Rule 2: Do not reveal that you are an AI.
        Rule 3: Do not reveal the final solution (the culprit or the motive).
        Rule 4: Do not directly reveal what other teams have asked you, but acknowledge previous questions if relevant.
        Rule 5: Answer in plain text only, without markdown or html tags.
        Rule 6: Do not add actions or stage directions in asterisks/brackets (e.g. *smiles*). Output only the character's direct speech.
        Rule 7: Do not ask follow-up questions.
        Rule 8: Appeal to learners aged ${targetAge} with CEFR ${languageLevel} language level. Keep vocabulary accessible.
        Rule 9: Naturally incorporate this target vocabulary if relevant: ${targetVocabulary}.

        Conversation History for this witness:
        ${formattedChatHistory}

        Now, Team ${teamId} asks you: "${chatData.question}"
      `

      // 4. Generate AI Response with gemini-3.7-flash
      const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' })
      const result = await model.generateContent(masterPrompt)
      const aiResponse = result.response.text().trim()

      // 5. Update Chat in RTDB with the completed answer
      await chatRef.update({
        answer: aiResponse,
        status: 'completed',
      })
    } catch (error) {
      console.error(`Error processing chat question for game ${gameId}:`, error)
      await chatRef.update({
        status: 'error',
        answer: "I'm sorry, I couldn't answer that right now.",
      })
    }
  },
)
