type JsonSchema = Record<string, unknown>;

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

export async function getStructuredJson<T>({
  name,
  schema,
  system,
  user,
}: {
  name: string;
  schema: JsonSchema;
  system: string;
  user: string;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema,
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as OpenAIResponse | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.error?.message || "OpenAI request failed.");
  }

  const text = extractText(payload);

  if (!text) {
    throw new Error("OpenAI returned an empty structured response.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }
}

function extractText(payload: OpenAIResponse) {
  if (payload.output_text) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}
