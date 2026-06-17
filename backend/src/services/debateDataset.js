// Curated dataset of debate techniques, fallacy examples, and argument patterns
// This acts as our local knowledge base for RAG retrieval

const debateDataset = [
  // Opening statement techniques
  {
    id: 'open_1',
    category: 'opening',
    text: 'A strong opening statement should clearly state your position in the first sentence, then preview your three strongest supporting points before the opponent can frame the debate first.',
  },
  {
    id: 'open_2',
    category: 'opening',
    text: 'Opening with a striking statistic or real-world example immediately grabs attention and grounds an abstract topic in concrete reality.',
  },
  {
    id: 'open_3',
    category: 'opening',
    text: 'Define key terms in your opening if the topic is ambiguous, so the debate proceeds on your preferred framing rather than your opponent\'s.',
  },

  // Rebuttal techniques
  {
    id: 'rebuttal_1',
    category: 'rebuttal',
    text: 'The strongest rebuttals directly quote or restate the opponent\'s claim before dismantling it, showing the judge you engaged with their actual argument rather than a strawman.',
  },
  {
    id: 'rebuttal_2',
    category: 'rebuttal',
    text: 'Concede minor points gracefully to build credibility, then pivot hard on the major point that actually decides the debate.',
  },
  {
    id: 'rebuttal_3',
    category: 'rebuttal',
    text: 'Turn an opponent\'s evidence against them by reframing it: "My opponent\'s own statistic actually proves my point because..."',
  },

  // Closing statement techniques
  {
    id: 'closing_1',
    category: 'closing',
    text: 'A closing statement should never introduce new arguments. Instead, it should crystallize the 2-3 strongest points already made and explain why they outweigh the opponent\'s case.',
  },
  {
    id: 'closing_2',
    category: 'closing',
    text: 'End on an emotional or memorable line that judges and audiences will remember after the debate ends — this is the "voter issue" technique.',
  },

  // Logical fallacies to avoid
  {
    id: 'fallacy_1',
    category: 'fallacy',
    text: 'Appeal to Tradition: arguing something is right just because it has always been done that way. Example: "We have always done it this way, so we should keep doing it."',
  },
  {
    id: 'fallacy_2',
    category: 'fallacy',
    text: 'Strawman: misrepresenting an opponent\'s argument to make it easier to attack. Example: arguing against a weaker version of what they actually said.',
  },
  {
    id: 'fallacy_3',
    category: 'fallacy',
    text: 'Ad Hominem: attacking the person making the argument rather than the argument itself. Example: "You can\'t trust their opinion because of who they are."',
  },
  {
    id: 'fallacy_4',
    category: 'fallacy',
    text: 'False Dichotomy: presenting only two options when more exist. Example: "Either we ban this completely or we do nothing at all."',
  },
  {
    id: 'fallacy_5',
    category: 'fallacy',
    text: 'Appeal to Emotion: using emotional manipulation instead of logical reasoning. Example: relying on fear or sympathy rather than evidence.',
  },
  {
    id: 'fallacy_6',
    category: 'fallacy',
    text: 'Slippery Slope: claiming one small step will inevitably lead to extreme consequences without justifying the chain of events.',
  },
  {
    id: 'fallacy_7',
    category: 'fallacy',
    text: 'Appeal to Authority: claiming something is true simply because an authority figure said so, without examining the actual evidence.',
  },

  // Rhetorical techniques
  {
    id: 'rhetoric_1',
    category: 'rhetoric',
    text: 'Ethos appeals to credibility and character — citing expert sources or establishing your own trustworthiness on the topic.',
  },
  {
    id: 'rhetoric_2',
    category: 'rhetoric',
    text: 'Pathos appeals to emotion — using stories, vivid imagery, or emotional language to make an argument resonate personally with the audience.',
  },
  {
    id: 'rhetoric_3',
    category: 'rhetoric',
    text: 'Logos appeals to logic — using statistics, syllogisms, and structured reasoning to build an airtight case.',
  },

  // Evidence and structure
  {
    id: 'evidence_1',
    category: 'evidence',
    text: 'The strongest arguments combine a clear claim, supporting evidence (statistics, examples, expert testimony), and an explicit explanation of why the evidence proves the claim.',
  },
  {
    id: 'evidence_2',
    category: 'evidence',
    text: 'Anecdotal evidence (a single personal story) is weaker than statistical evidence because it cannot be generalized — strong debaters combine both for emotional and logical impact.',
  },
  {
    id: 'evidence_3',
    category: 'evidence',
    text: 'Anticipating the opponent\'s strongest counter-argument and addressing it preemptively (called "pre-bunking") is one of the most powerful advanced debate techniques.',
  },

  // Topic-agnostic argument frameworks
  {
    id: 'framework_1',
    category: 'framework',
    text: 'The Cost-Benefit framework weighs the practical advantages against disadvantages of a policy or position, useful for "should we do X" debates.',
  },
  {
    id: 'framework_2',
    category: 'framework',
    text: 'The Rights-based framework argues from fundamental rights or freedoms rather than practical outcomes, useful for ethical or moral debates.',
  },
  {
    id: 'framework_3',
    category: 'framework',
    text: 'The Stakeholder framework examines how a position affects different groups differently (e.g. consumers vs businesses, individuals vs society) to find the strongest angle.',
  },
];

module.exports = debateDataset;