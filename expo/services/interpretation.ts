import Anthropic from '@anthropic-ai/sdk';
import Constants from 'expo-constants';

// Read from .env locally or EAS secrets in CI builds
const ANTHROPIC_API_KEY = Constants.expoConfig?.extra?.anthropicApiKey ?? '';

const SYSTEM_PROMPT = `You are a dream interpretation assistant. Provide a concise, personalized interpretation covering key symbols, emotional themes, and one reflective insight.

Rules:
- 2 short paragraphs maximum (4-6 sentences total). Be concise — this is read on a phone screen.
- Warm, curious tone. Not clinical. Use "this often represents," "this may suggest."
- End with a line: Key symbols: (list 3-5 symbols, comma-separated, no explanations)
- Do NOT include any title, header, or disclaimer. Do NOT use markdown (no #, **, *, bullets).
- Output plain text only.`;

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
