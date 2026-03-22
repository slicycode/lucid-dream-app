import Anthropic from '@anthropic-ai/sdk';

// TODO: Move to a backend proxy before production to protect this key
const ANTHROPIC_API_KEY = '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';

const SYSTEM_PROMPT = `You are a dream interpretation assistant. Analyze the dream described below and provide a thoughtful, personalized interpretation. Cover:

1. Key symbols and their common psychological meanings
2. Emotional themes and what they might reflect about the dreamer's waking life
3. Recurring patterns or connections to common human experiences
4. A brief, encouraging insight the dreamer can reflect on

Keep the tone warm, curious, and non-clinical. This is for self-reflection and entertainment, not therapy. Avoid definitive claims — use language like "this often represents," "this may suggest," "many dreamers find."

Format: 3-4 paragraphs of flowing prose, then a "Key symbols:" line listing 3-5 extracted symbols as comma-separated items (symbol name only, no parenthetical explanations on this line).

IMPORTANT: End every interpretation with this disclaimer on a new line:
"This interpretation is for entertainment and self-reflection purposes only. It is not professional psychological advice."`;

interface InterpretParams {
  dreamText: string;
  emotion: string;
  themes: string[];
  isLucid: boolean;
}

interface InterpretResult {
  interpretation: string;
  symbols: string[];
}

function parseSymbols(text: string): string[] {
  const match = text.match(/Key symbols?:\s*(.+)/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((s) => s.replace(/\(.*?\)/g, '').trim())
    .filter((s) => s.length > 0 && s.length < 50);
}

// Guardrails: cap input to ~500 tokens, output to ~600 tokens
// At Haiku 4.5 pricing ($1/$5 per MTok): worst case ~$0.004/call
const MAX_DREAM_TEXT_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 600;

export async function interpretDream(params: InterpretParams): Promise<InterpretResult> {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const trimmedDream = params.dreamText.slice(0, MAX_DREAM_TEXT_CHARS);

  const userPrompt = [
    `Dream: ${trimmedDream}`,
    `Emotion: ${params.emotion}`,
    `Themes: ${params.themes.join(', ') || 'none specified'}`,
    `Lucid: ${params.isLucid ? 'yes' : 'no'}`,
  ].join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  const fullText = textBlock?.text ?? '';

  const symbols = parseSymbols(fullText);

  return { interpretation: fullText, symbols };
}
