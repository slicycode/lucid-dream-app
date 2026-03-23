const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

const SYSTEM_PROMPT = `You are writing a brief, warm weekly dream digest for a personal dream journal app.
Given a list of dreams from the past week, write 2-3 sentences summarizing the week.
- Mention how many dreams were logged
- Note any recurring themes, emotions, or symbols if present
- End with a single gentle insight or observation
- Tone: warm, observational, personal. Use "you" not "the dreamer."
- Plain text only. No titles, headers, bullets, or markdown.`;

const MAX_OUTPUT_TOKENS = 200;

export async function POST(request: Request) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { dreams, weekOf } = body;

    if (!Array.isArray(dreams) || dreams.length === 0) {
      return Response.json({ error: 'dreams array is required' }, { status: 400 });
    }

    const dreamList = dreams
      .map((d: { title: string; emotion: string; themes: string[]; dreamType: string }, i: number) =>
        `${i + 1}. "${d.title}" — ${d.emotion}${d.themes.length ? `, themes: ${d.themes.join(', ')}` : ''}${d.dreamType === 'nightmare' ? ' (nightmare)' : ''}`
      )
      .join('\n');

    const userPrompt = `Week of ${weekOf}. Dreams logged this week:\n${dreamList}`;

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
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return Response.json({ error: 'Summary service unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const textBlock = data.content?.find((b: any) => b.type === 'text');
    const summary: string = textBlock?.text?.trim() ?? '';

    return Response.json({ summary });
  } catch (error) {
    console.error('Weekly summary API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
