interface OnboardingInterpretation {
  keywords: string[];
  interpretation: string;
  symbols: string[];
}

const INTERPRETATIONS: OnboardingInterpretation[] = [
  {
    keywords: ['water', 'ocean', 'sea', 'swim', 'drown', 'flood', 'rain', 'river', 'lake', 'wave'],
    interpretation: `Water in your dream often reflects the emotional currents running beneath your waking life — the feelings you carry but don't always name. The way it moved, whether rising slowly or crashing around you, mirrors how those emotions are building. There's something you've been holding back or haven't fully processed yet.

Consider what felt most urgent in the dream. Your subconscious is drawing your attention to something that needs space — not solving, just acknowledging. Sometimes the flood isn't a warning. It's an invitation to stop holding the dam.`,
    symbols: ['Water', 'Emotional depth', 'Hidden currents'],
  },
  {
    keywords: ['fall', 'falling', 'cliff', 'drop', 'height', 'ledge', 'jump'],
    interpretation: `Falling in a dream rarely means what people think. It's not about fear of failure — it's about the moment right before you let go of control. Something in your life is shifting, and part of you is resisting the free fall. The ground isn't the threat. The loss of grip is.

Ask yourself where you've been white-knuckling lately. The dream isn't telling you you'll crash. It's showing you what it feels like to hold on too tight to something that's already moving.`,
    symbols: ['Falling', 'Loss of control', 'Letting go'],
  },
  {
    keywords: ['fly', 'flying', 'float', 'air', 'soar', 'wing', 'sky', 'above'],
    interpretation: `Flying dreams tend to surface when something in your life is expanding — a new perspective, a sense of freedom you haven't fully claimed yet. The ease or struggle of the flight reflects how comfortable you are with this new territory. If it felt effortless, you're closer to trusting it than you think.

What's shifted recently that gave you a wider view? Your subconscious is letting you rehearse what it feels like to rise above the noise. That lightness isn't fantasy — it's a feeling you're ready to carry into waking life.`,
    symbols: ['Flight', 'Freedom', 'New perspective'],
  },
  {
    keywords: ['house', 'room', 'door', 'building', 'home', 'apartment', 'hallway', 'stair', 'window'],
    interpretation: `The house in your dream is almost always a map of yourself — rooms you know well, rooms you've forgotten, and doors you haven't opened yet. The parts that felt familiar reflect what you already understand about who you are. The unfamiliar spaces are the parts still waiting to be explored.

Pay attention to which room drew you in most. That's where the growth is right now. Your subconscious builds these spaces when it's ready for you to walk through them — not when it's warning you away.`,
    symbols: ['House', 'Self-exploration', 'Hidden rooms'],
  },
  {
    keywords: ['chase', 'chasing', 'run', 'running', 'escape', 'hide', 'follow', 'pursue', 'caught'],
    interpretation: `Being chased is one of the most common dream patterns, and it's almost never about the thing behind you. It's about what you're avoiding while awake — a conversation, a decision, a feeling you've been outrunning. The pursuer often represents the part of yourself you're not ready to face yet.

Instead of asking what was chasing you, ask what you've been running from lately. The dream stops recurring when you turn around. Not to fight — just to look.`,
    symbols: ['Pursuit', 'Avoidance', 'Confrontation'],
  },
  {
    keywords: ['teeth', 'tooth', 'mouth', 'bite', 'jaw', 'smile'],
    interpretation: `Teeth dreams often surface during moments of vulnerability — times when you're worried about how you're perceived or whether you're holding things together. Losing teeth in a dream reflects a quiet fear of losing your grip on something that feels essential to your identity or confidence.

Think about what's felt fragile lately — not broken, just uncertain. Your subconscious uses teeth because they're tied to how you present yourself to the world. The dream isn't predicting loss. It's reflecting a fear that's worth naming.`,
    symbols: ['Teeth', 'Vulnerability', 'Self-image'],
  },
  {
    keywords: ['school', 'exam', 'test', 'class', 'teacher', 'late', 'unprepared', 'homework', 'study'],
    interpretation: `School dreams almost always surface when you feel like you're being evaluated — even if there's no literal test in your life right now. The anxiety of being unprepared or arriving late mirrors a deeper feeling that you're not measuring up to something, or that you've missed a step others haven't.

Ask yourself where you've been grading yourself lately. The dream isn't saying you're failing. It's showing you that the standards you're holding yourself to might not even be yours.`,
    symbols: ['Examination', 'Self-judgment', 'Pressure'],
  },
  {
    keywords: ['animal', 'dog', 'cat', 'snake', 'bird', 'spider', 'wolf', 'bear', 'fish', 'insect'],
    interpretation: `Animals in dreams tend to represent instincts — the parts of you that act before thinking. The specific animal and how it behaved reflects which instinct is trying to get your attention right now. Something wild, something you can't fully control, is stirring beneath the surface of your daily routine.

Consider how you felt toward the animal — fear, curiosity, protectiveness. That reaction tells you more than the animal itself. Your subconscious speaks in creatures when words aren't enough for what it's trying to say.`,
    symbols: ['Animal instinct', 'Intuition', 'Wildness'],
  },
  {
    keywords: ['death', 'die', 'dead', 'funeral', 'grave', 'kill', 'ghost', 'spirit'],
    interpretation: `Death in dreams is almost never literal — it's one of the most misunderstood symbols. It usually marks the end of a chapter, a role, or a version of yourself that's being outgrown. Something in your life is transforming, and your subconscious is processing the grief of letting the old form go, even when the new one is better.

What's ending or changing right now, even quietly? The dream isn't a warning. It's your mind's way of making space for what comes next. Endings and beginnings share the same doorway.`,
    symbols: ['Transformation', 'Endings', 'Renewal'],
  },
  {
    keywords: ['person', 'people', 'friend', 'stranger', 'family', 'mother', 'father', 'ex', 'child', 'baby', 'someone', 'face'],
    interpretation: `The people in your dream rarely represent themselves — they're often standing in for parts of you. A familiar face reflects a quality you associate with that person, showing up because it's relevant to something you're navigating right now. A stranger usually represents an aspect of yourself you haven't met yet.

Think about what that person means to you in one word. That word is the real subject of the dream. Your subconscious casts characters the way a director would — not randomly, but because they carry exactly the energy the scene needs.`,
    symbols: ['Projection', 'Relationships', 'Self-reflection'],
  },
];

/** Fallback when no keywords match */
const FALLBACK: OnboardingInterpretation = {
  keywords: [],
  interpretation: `Your dream carries a quiet complexity — the kind that doesn't reveal itself all at once. The images and feelings that stayed with you after waking are the ones worth paying attention to. They're not random. They're the parts your subconscious wanted you to remember.

Sit with what felt most vivid. Not the plot, but the emotion underneath it. Dreams speak in feeling first, story second. The fact that this one lingered means something in your waking life is asking for your attention — gently, not urgently.`,
  symbols: ['Subconscious', 'Emotional residue', 'Inner attention'],
};

/**
 * Match the user's dream text to the best pre-written interpretation.
 * Scans for keyword density and returns the highest-scoring match.
 */
export function matchOnboardingInterpretation(dreamText: string): {
  interpretation: string;
  symbols: string[];
} {
  const lower = dreamText.toLowerCase();

  let bestMatch = FALLBACK;
  let bestScore = 0;

  for (const entry of INTERPRETATIONS) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return {
    interpretation: bestMatch.interpretation,
    symbols: bestMatch.symbols,
  };
}
