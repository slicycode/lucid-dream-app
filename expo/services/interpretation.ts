interface InterpretParams {
  dreamText: string;
  emotion: string;
  themes: string[];
  isLucid: boolean;
  dreamType?: string;
  vividness?: number | null;
  isFirstPerson?: boolean;
}

interface InterpretResult {
  interpretation: string;
  symbols: string[];
}

export async function interpretDream(params: InterpretParams): Promise<InterpretResult> {
  const response = await fetch('/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dreamText: params.dreamText,
      emotion: params.emotion,
      themes: params.themes,
      isLucid: params.isLucid,
      dreamType: params.dreamType,
      vividness: params.vividness,
      isFirstPerson: params.isFirstPerson,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error ?? `Interpretation failed (${response.status})`);
  }

  return response.json();
}
