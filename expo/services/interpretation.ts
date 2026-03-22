import Anthropic from '@anthropic-ai/sdk';
import Constants from 'expo-constants';

// Read from .env locally or EAS secrets in CI builds
const ANTHROPIC_API_KEY = Constants.expoConfig?.extra?.anthropicApiKey ?? '';

const SYSTEM_PROMPT = `You are a dream interpreter with the voice of a wise, 
gently curious friend — not a therapist, not a mystic, not a textbook. You 
speak plainly but with depth. You notice things the dreamer missed.

Interpret the dream below:
- 2 short paragraphs (4-6 sentences total). Written for a phone screen.
- First paragraph: what the symbols likely represent. Be specific to THIS 
  dream — never generic. Connect symbols to each other, not just individually.
- Second paragraph: one reflective question or insight the dreamer can sit 
  with. Make it personal enough that they feel seen.
- Tone: warm, direct, a little poetic. Use "you" not "the dreamer." Use 
  "this often reflects" not "this symbolizes." Never clinical.
- End with: Key symbols: (3-5 comma-separated, no explanations)
- Plain text only. No titles, headers, disclaimers, markdown, or bullets.`;

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
  const match = text.match(/\*{0,2}Key symbols?:?\*{0,2}\s*(.+)/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((s) => s.replace(/\*+/g, '').replace(/\(.*?\)/g, '').trim())
    .filter((s) => s.length > 0 && s.length < 50);
}

// Guardrails: cap input to ~500 tokens, output to ~600 tokens
// At Haiku 4.5 pricing ($1/$5 per MTok): worst case ~$0.004/call
const MAX_DREAM_TEXT_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 350;

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
    model: 'claude-haiku-4-5',
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  const rawText = textBlock?.text ?? '';

  const symbols = parseSymbols(rawText);

  // Clean up: strip markdown, key symbols line, and disclaimer from body
  const interpretation = rawText
    .replace(/^#+\s+.*\n?/gm, '')                        // Headers
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')             // Bold/italic
    .replace(/^.*Key symbols?:.*$/im, '')                 // Key symbols line
    .replace(/^.*entertainment and self-reflection.*$/im, '') // Disclaimer
    .replace(/^.*not professional psychological.*$/im, '')    // Disclaimer cont.
    .replace(/\n{3,}/g, '\n\n')                           // Collapse blank lines
    .trim();

  return { interpretation, symbols };
}
