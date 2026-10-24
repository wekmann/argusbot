import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import { architectureSchema, type Architecture } from "./architecture";

const SYSTEM = `You design Discord server structures. Reply with ONLY a JSON object (no markdown) of shape:
{"roles":[{"name":string,"color":"#RRGGBB","permissions":[string]}],
 "categories":[{"name":string,"channels":[{"name":string,"type":"text"|"voice"|"announcement"|"forum","topic":string|null}]}]}
Permissions use Discord flag names like ADMINISTRATOR, MANAGE_MESSAGES, KICK_MEMBERS, BAN_MEMBERS, SEND_MESSAGES, VIEW_CHANNEL, CONNECT, SPEAK.
Channel names are lowercase-with-dashes. Keep it practical: 3-10 roles, 2-8 categories.`;

export async function generateWithGemini(prompt: string): Promise<Architecture> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  let failure: unknown = null;
  const result = streamText({
    model: provider("google/gemini-3.8-flash"),
    system: SYSTEM,
    prompt: `Server description (json output): ${prompt}`,
    onError: ({ error }) => {
      failure = error;
    },
  });
  const text = await result.text;
  if (failure) {
    const status = (failure as { statusCode?: number }).statusCode;
    if (status === 429) throw new Error("AI is busy, please try again in a moment.");
    if (status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error("AI generation failed.");
  }
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return architectureSchema.parse(JSON.parse(json));
  } catch {
    throw new Error("The AI returned an invalid structure. Try rephrasing your prompt.");
  }
}
