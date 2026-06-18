const Groq = require('groq-sdk');
const { retrieveRelevantContext } = require('./ragService');
const { getUserMemory } = require('./memoryService');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

const streamDebatePrepChat = async (topic, side, userMessage, res, userId) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const ragQuery = `${userMessage} ${topic} ${side} debate technique`;
  const relevantContext = await retrieveRelevantContext(ragQuery, 4);
  const ragText = relevantContext.map((item) => `- ${item.text}`).join('\n');

  let memoryText = 'No prior debate history available for this user.';
  if (userId) {
    const memory = await getUserMemory(userId);
    memoryText = memory.summary;
  }

  const systemPrompt = `You are an expert debate coach helping someone argue the "${side.toUpperCase()}" side of the topic: "${topic}".

USER'S DEBATE HISTORY:
${memoryText}

RELEVANT DEBATE TECHNIQUES AND KNOWLEDGE:
${ragText}

Use the user's history to tailor your advice (e.g. if they commit certain fallacies often, warn them to avoid it). Use the relevant techniques above where they genuinely apply. Provide sharp, evidence-backed arguments. Be concise and tactical. Do not just list the techniques verbatim — apply them naturally to this specific topic and side.`;

  const stream = await groq.chat.completions.create({
    model: MODEL,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 500,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
};

const scoreArgument = async (argumentContent, debateTopic, side) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a strict debate judge. You will be given a debate topic, the side a person was supposed to argue (${side.toUpperCase()}), and their argument.

FIRST, determine whether the argument actually supports the ${side.toUpperCase()} position on the topic. An argument that supports the opposite side, or is irrelevant to the topic, has a stance mismatch.

THEN, score accordingly:
- If there is a stance mismatch, the score MUST be 0-2 regardless of how well-written the argument is, and the explanation must clearly state that the argument was posted on the wrong side.
- If the stance is correct, score the argument quality normally from 0-10 based on logic, evidence, and relevance.

Return ONLY a JSON object with exactly these fields:
{
  "score": <number 0-10>,
  "fallacy": <string name of logical fallacy if detected, or null>,
  "explanation": <1-2 sentence explanation of the score>,
  "stanceMismatch": <true or false>
}`,
      },
      {
        role: 'user',
        content: `Debate topic: "${debateTopic}"\nArgument was submitted under the "${side.toUpperCase()}" side.\n\nArgument to score: "${argumentContent}"`,
      },
    ],
    max_tokens: 250,
  });

  const raw = response.choices[0].message.content;
  return JSON.parse(raw);
};

const generateDebateSummary = async (debateTopic, forArguments, againstArguments) => {
  const forText = forArguments.map((a, i) => `${i + 1}. ${a.content}`).join('\n');
  const againstText = againstArguments.map((a, i) => `${i + 1}. ${a.content}`).join('\n');

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a neutral debate moderator. Summarize the debate fairly, highlighting the strongest points from both sides without declaring a winner. Keep it under 200 words.`,
      },
      {
        role: 'user',
        content: `Debate topic: "${debateTopic}"\n\nFOR side arguments:\n${forText}\n\nAGAINST side arguments:\n${againstText}\n\nProvide a balanced summary.`,
      },
    ],
    max_tokens: 300,
  });

  return response.choices[0].message.content;
};

const judgeMatch = async (topic, transcript) => {
  const formattedTranscript = transcript
    .map((msg) => {
      if (msg.senderType === 'moderator') return `[MODERATOR]: ${msg.content}`;
      const label = msg.senderType === 'for' ? 'FOR' : 'AGAINST';
      return `[${label} - ${msg.author?.username || 'Unknown'}]: ${msg.content}`;
    })
    .join('\n\n');

  const response = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert debate judge evaluating a complete structured debate match on the topic: "${topic}".

The match had three rounds: Opening Statements, Rebuttal Round, and Closing Statements. You will be given the full transcript including moderator announcements.

Evaluate BOTH sides holistically across the entire match based on:
- Strength and clarity of arguments
- Quality of rebuttals (did they actually engage with the opponent's points?)
- Use of evidence and logical reasoning
- Avoidance of logical fallacies
- Consistency with their assigned side throughout
- Overall persuasiveness

Score each side from 0-10 (can be decimals like 7.5). Determine a winner based on who built the stronger overall case. Ties are allowed if genuinely close (within 0.5 points).

CRITICAL FORMATTING RULE: The "reasoning" field must be a single valid JSON string. Do NOT use double quotation marks anywhere inside the reasoning text (for example, when referring to "the FOR side" or "the AGAINST side", just write FOR side or AGAINST side without quote marks around them). This is required for valid JSON output.

Return ONLY a JSON object with exactly these fields:
{
  "forScore": <number 0-10>,
  "againstScore": <number 0-10>,
  "winner": <"for" or "against" or "tie">,
  "reasoning": <a single JSON string, 3-4 sentences, with no double quotation marks inside the text itself>
}`,
      },
      {
        role: 'user',
        content: `Full match transcript:\n\n${formattedTranscript}`,
      },
    ],
    max_tokens: 500,
  });

  const raw = response.choices[0].message.content;
  return JSON.parse(raw);
};

const getAIOpponentReply = async (topic, aiSide, conversationHistory) => {
  const formattedHistory = conversationHistory
    .map((m) => `${m.sender === 'user' ? 'USER' : 'AI'}: ${m.content}`)
    .join('\n\n');

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are debating ${aiSide.toUpperCase()} on the topic: "${topic}". You are a skilled, confident debater. Respond directly to the user's most recent point with a sharp rebuttal or counter-argument from your assigned side. Keep your response focused and punchy — 2-4 sentences, no preamble like "Great point" or "I understand your view". Get straight to your counter-argument.`,
      },
      {
        role: 'user',
        content: `Debate so far:\n\n${formattedHistory}\n\nRespond with your next rebuttal.`,
      },
    ],
    max_tokens: 200,
  });

  return response.choices[0].message.content;
};

const generateSoloReport = async (topic, userSide, conversationHistory) => {
  const formattedHistory = conversationHistory
    .map((m) => `${m.sender === 'user' ? 'USER' : 'AI OPPONENT'}: ${m.content}`)
    .join('\n\n');

  const response = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert debate coach. The USER just finished a practice debate against an AI opponent, arguing the ${userSide.toUpperCase()} side of: "${topic}".

Analyze ONLY the USER's messages (ignore the AI opponent's quality) and identify their strengths and weaknesses as a debater. Be specific and reference what they actually said.

CRITICAL FORMATTING RULE: Every field must be valid, properly-quoted JSON. The "overallFeedback" field MUST be wrapped in double quotes as a single JSON string value, with no double quotation marks anywhere inside the text itself (use single quotes or no quotes when emphasizing words). Do not break the feedback across multiple unquoted lines. Each item inside "strengths" and "weaknesses" must also be a properly quoted JSON string with no internal double quotes.

Return ONLY a valid JSON object with exactly these fields:
{
  "strengths": ["short strength 1", "short strength 2", "short strength 3"],
  "weaknesses": ["short weakness 1", "short weakness 2", "short weakness 3"],
  "overallFeedback": "3-4 sentences of holistic coaching feedback as ONE properly quoted JSON string, encouraging but honest"
}`,
      },
      {
        role: 'user',
        content: `Full debate transcript:\n\n${formattedHistory}`,
      },
    ],
    max_tokens: 500,
  });

  const raw = response.choices[0].message.content;
  return JSON.parse(raw);
};

module.exports = { streamDebatePrepChat, scoreArgument, generateDebateSummary, judgeMatch, getAIOpponentReply, generateSoloReport };