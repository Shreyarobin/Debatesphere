const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const streamDebatePrepChat = async (topic, side, userMessage, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `You are an expert debate coach helping someone argue the "${side.toUpperCase()}" side of the topic: "${topic}". Provide sharp, evidence-backed arguments. Be concise and tactical.`,
      },
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

const scoreArgument = async (argumentContent, debateTopic) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a debate judge. Analyze the given argument for the debate topic provided.
Return ONLY a JSON object with exactly these fields:
{
  "score": <number 0-10>,
  "fallacy": <string name of logical fallacy if detected, or null>,
  "explanation": <1-2 sentence explanation of the score>
}`,
      },
      {
        role: 'user',
        content: `Debate topic: "${debateTopic}"\n\nArgument to score: "${argumentContent}"`,
      },
    ],
    max_tokens: 200,
  });

  const raw = response.choices[0].message.content;
  return JSON.parse(raw);
};

const generateDebateSummary = async (debateTopic, forArguments, againstArguments) => {
  const forText = forArguments.map((a, i) => `${i + 1}. ${a.content}`).join('\n');
  const againstText = againstArguments.map((a, i) => `${i + 1}. ${a.content}`).join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
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

module.exports = { streamDebatePrepChat, scoreArgument, generateDebateSummary };