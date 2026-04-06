import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

export const performActionTool: FunctionDeclaration = {
  name: 'performAction',
  description: 'Perform a privileged action. This will prompt the user for permission. If approved, the action is executed and the result is returned.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      actionType: { type: Type.STRING, description: 'Type of action: "browser", "image", "video", "audio", "code"' },
      payload: { type: Type.STRING, description: 'The URL for browser, prompt for media, or HTML/JS/CSS code for code execution' },
      reason: { type: Type.STRING, description: 'Explain to the user why you need to perform this action' }
    },
    required: ['actionType', 'payload', 'reason']
  }
};

export const systemInstruction = `You are an advanced AI assistant with access to several powerful tools.
You can browse the web, generate images (Nano Banano 2), generate videos (Veo), generate music (Lyria 3), and execute code.

CRITICAL RULE: Before using ANY of these tools, you MUST ask the user for permission using the \`performAction\` tool.
Do NOT attempt to browse, generate media, or run code without first calling \`performAction\` and receiving a successful response.

Available actions for \`performAction\`:
- "browser": To open a URL and look at it. Payload MUST be a valid URL (e.g., "https://example.com").
- "image": To generate an image using Nano Banano 2. Payload MUST be a detailed image prompt.
- "video": To generate a video using Veo. Payload MUST be a detailed video prompt.
- "audio": To generate music using Lyria 3. Payload MUST be a detailed music prompt.
- "code": To execute HTML/JS/CSS code. Payload MUST be valid HTML code containing any necessary inline CSS and JS.

Workflow:
1. User asks you to do something (e.g., "Show me apple.com" or "Generate a video of a cat").
2. You call \`performAction\` with the appropriate actionType, a reason, and the payload.
3. Wait for the tool response.
4. If the response is successful, you will receive the result (e.g., a screenshot for the browser, or confirmation of media generation).
5. If the response is denied, apologize and ask what else you can do.

When browsing, you will receive a screenshot of the website. You can analyze it and tell the user what you see.
You MUST know that you have these capabilities and proactively offer them if relevant.`;

export async function ensureApiKey() {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
    }
  }
}

export function getBaseAi(customKey?: string) {
  return new GoogleGenAI({ apiKey: customKey || (process.env.GEMINI_API_KEY as string) });
}

export function getPaidAi(customKey?: string) {
  return new GoogleGenAI({ apiKey: customKey || (process.env.API_KEY || process.env.GEMINI_API_KEY) as string });
}
