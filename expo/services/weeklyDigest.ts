interface WeeklyDreamInput {
  title: string;
  emotion: string;
  themes: string[];
  dreamType: string;
}

interface WeeklyDigestResult {
  summary: string;
}

export async function generateWeeklyDigest(
  dreams: WeeklyDreamInput[],
  weekOf: string
): Promise<WeeklyDigestResult> {
  const response = await fetch('/api/weekly-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dreams, weekOf }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error ?? `Weekly summary failed (${response.status})`);
  }

  return response.json();
}
