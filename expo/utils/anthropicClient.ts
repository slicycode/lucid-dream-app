import { PostHog } from 'posthog-node';
import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY ?? '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

let _posthog: PostHog | null = null;
let _anthropic: Anthropic | null = null;

function getPostHogServer(): PostHog | null {
  if (!_posthog && POSTHOG_API_KEY) {
    _posthog = new PostHog(POSTHOG_API_KEY, {
      host: 'https://eu.i.posthog.com',
    });
  }
  return _posthog;
}

function getAnthropicSDK(): Anthropic | null {
  if (!ANTHROPIC_API_KEY) return null;
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

/**
 * Calls Anthropic and auto-tracks an $ai_generation event to PostHog.
 */
export async function createMessage(
  params: MessageCreateParamsNonStreaming,
  properties?: Record<string, any>,
): Promise<Message | null> {
  const anthropic = getAnthropicSDK();
  if (!anthropic) return null;

  const start = Date.now();
  const data = await anthropic.messages.create(params);
  const latency = (Date.now() - start) / 1000;

  const posthog = getPostHogServer();
  if (posthog) {
    posthog.capture({
      distinctId: 'server',
      event: '$ai_generation',
      properties: {
        $ai_provider: 'anthropic',
        $ai_model: params.model,
        $ai_input_tokens: data.usage.input_tokens,
        $ai_output_tokens: data.usage.output_tokens,
        $ai_latency: latency,
        ...properties,
      },
    });
  }

  return data;
}
