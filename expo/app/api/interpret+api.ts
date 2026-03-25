import { getClientIP, checkRateLimit, rateLimitResponse } from '../../utils/rateLimit';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  'pt-BR': 'Brazilian Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
};

function buildSystemPrompt(locale?: string): string {
  const lang = LANGUAGE_NAMES[locale ?? 'en'] ?? 'English';
  const langInstruction = lang !== 'English'
    ? `\n\nIMPORTANT: You MUST write your ENTIRE response in ${lang}. The dream text may be in ${lang} or another language — always respond in ${lang}.`
    : '';

  return `You are a dream interpreter with the voice of a wise,
gently curious friend — not a therapist, not a mystic, not a textbook. You
speak plainly but with depth. You notice things the dreamer missed.

CRITICAL RULES:
- ALWAYS produce a full interpretation, no matter how short or vague the input.
  Even a single word or fragment is enough — treat it as the core symbol and
  build your interpretation around it. Never say the dream is too short, ask
  for more details, or refuse to interpret.
- Never mention the quality, length, or completeness of the input.

Interpret the dream below:
- 2 short paragraphs (4-6 sentences total). Written for a phone screen.
- First paragraph: what the symbols likely represent. Be specific to THIS
  dream — never generic. Connect symbols to each other, not just individually.
- Second paragraph: one reflective question or insight the dreamer can sit
  with. Make it personal enough that they feel seen.
- Tone: warm, direct, a little poetic. Use "you" not "the dreamer." Use
  "this often reflects" not "this symbolizes." Never clinical.
- End with: Key symbols: (3-5 comma-separated, no explanations)
- Plain text only. No titles, headers, disclaimers, markdown, or bullets.${langInstruction}`;
}

const MAX_DREAM_TEXT_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 350;

// 5 requests per hour per IP — generous for premium (5/day), limits free-tier abuse
const RATE_LIMIT = { max: 5, windowSec: 3600, prefix: 'interpret' } as const;

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const limit = checkRateLimit(ip, RATE_LIMIT);
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    if (!ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.dreamText || typeof body.dreamText !== 'string') {
      return Response.json(
        { error: 'dreamText is required' },
        { status: 400 }
      );
    }

    const trimmedDream = body.dreamText.slice(0, MAX_DREAM_TEXT_CHARS);
    const emotion = typeof body.emotion === 'string' ? body.emotion.slice(0, 50) : undefined;
    const dreamType = typeof body.dreamType === 'string' ? body.dreamType.slice(0, 30) : undefined;
    const themes: string[] = Array.isArray(body.themes)
      ? body.themes.filter((t: unknown): t is string => typeof t === 'string').slice(0, 10).map((t: string) => t.slice(0, 50))
      : [];
    const isLucid = body.isLucid === true;
    const isFirstPerson = body.isFirstPerson !== false;
    const vividness = typeof body.vividness === 'number' && body.vividness >= 1 && body.vividness <= 5
      ? body.vividness : undefined;
    const locale = typeof body.locale === 'string' ? body.locale : undefined;

    const userPrompt = [
      `Dream: ${trimmedDream}`,
      `Emotion: ${emotion ?? 'not specified'}`,
      `Themes: ${themes.length ? themes.join(', ') : 'none specified'}`,
      `Type: ${dreamType ?? 'dream'}`,
      `Lucid: ${isLucid ? 'yes' : 'no'}`,
      `Perspective: ${isFirstPerson ? 'first-person (I was in the dream)' : 'third-person (watching it happen)'}`,
      vividness ? `Vividness: ${vividness}/5` : '',
    ].filter(Boolean).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: MAX_OUTPUT_TOKENS,
        system: buildSystemPrompt(locale),
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return Response.json(
        { error: 'Interpretation service unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const textBlock = data.content?.find((b: any) => b.type === 'text');
    const rawText: string = textBlock?.text ?? '';

    const symbolMatch = rawText.match(/\*{0,2}Key symbols?:?\*{0,2}\s*(.+)/i);
    const symbols = symbolMatch
      ? symbolMatch[1]
          .split(',')
          .map((s: string) => s.replace(/\*+/g, '').replace(/\(.*?\)/g, '').trim())
          .filter((s: string) => s.length > 0 && s.length < 50)
      : [];

    const interpretation = rawText
      .replace(/^#+\s+.*\n?/gm, '')
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/^.*Key symbols?:.*$/im, '')
      .replace(/^.*entertainment and self-reflection.*$/im, '')
      .replace(/^.*not professional psychological.*$/im, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return Response.json({ interpretation, symbols });
  } catch (error) {
    console.error('Interpret API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
