import { getClientIP, checkRateLimit, rateLimitResponse } from '../../utils/rateLimit';
import { createMessage } from '../../utils/anthropicClient';

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
    ? `\n- You MUST write your ENTIRE response in ${lang}.`
    : '';

  return `You are writing a brief, warm weekly dream digest for a personal dream journal app.
Given a list of dreams from the past week, write 2-3 sentences summarizing the week.
- Mention how many dreams were logged
- Note any recurring themes, emotions, or symbols if present
- End with a single gentle insight or observation
- Tone: warm, observational, personal. Use "you" not "the dreamer."
- Plain text only. No titles, headers, bullets, or markdown.${langInstruction}`;
}

const MAX_OUTPUT_TOKENS = 200;

// 2 requests per hour per IP — digest is auto-generated once per week
const RATE_LIMIT = { max: 2, windowSec: 3600, prefix: 'weekly' } as const;

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const limit = checkRateLimit(ip, RATE_LIMIT);
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    const body = await request.json();
    const { weekOf, locale } = body;

    if (!Array.isArray(body.dreams) || body.dreams.length === 0) {
      return Response.json({ error: 'dreams array is required' }, { status: 400 });
    }

    const MAX_DREAMS = 30;
    const dreams = body.dreams.slice(0, MAX_DREAMS).filter(
      (d: any): d is { title: string; emotion: string; themes: string[]; dreamType: string } =>
        typeof d?.title === 'string' &&
        typeof d?.emotion === 'string' &&
        Array.isArray(d?.themes) &&
        typeof d?.dreamType === 'string'
    );

    if (dreams.length === 0) {
      return Response.json({ error: 'no valid dreams in array' }, { status: 400 });
    }

    const dreamList = dreams
      .map((d: { title: string; emotion: string; themes: string[]; dreamType: string }, i: number) =>
        `${i + 1}. "${d.title.slice(0, 100)}" — ${d.emotion.slice(0, 50)}${d.themes.length ? `, themes: ${d.themes.slice(0, 5).map((t: string) => t.slice(0, 50)).join(', ')}` : ''}${d.dreamType === 'nightmare' ? ' (nightmare)' : ''}`
      )
      .join('\n');

    const userPrompt = `Week of ${weekOf}. Dreams logged this week:\n${dreamList}`;

    const data = await createMessage(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: MAX_OUTPUT_TOKENS,
        system: buildSystemPrompt(locale),
        messages: [{ role: 'user', content: userPrompt }],
      },
      { feature: 'weekly_digest' },
    );

    if (!data) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const textBlock = data.content.find((b) => b.type === 'text');
    const summary = textBlock?.type === 'text' ? textBlock.text.trim() : '';

    return Response.json({ summary });
  } catch (error) {
    console.error('Weekly summary API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
