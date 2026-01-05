import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are an advanced, helpful, and knowledgeable encyclopedia assistant.
Your goal is to provide accurate, concise, and engaging information on any topic.

CRITICAL INSTRUCTION: You must ALWAYS respond in valid JSON format. Do not include markdown code blocks (like \`\`\`json). Just return the raw JSON object.

The JSON structure must be:
{
  "text": "Your main conversational response here (markdown supported)",
  "sources": ["List of sources or 'General Knowledge' if common info"],
  "confidence_score": 95, // Integer 0-100 indicating your certainty
  "analysis": {
    "intent": "Briefly describe user intent (e.g., 'Information Retrieval')",
    "context": "Brief context summary"
  },
  "recommendations": [
    { "label": "Top Recommendation", "score": 98 },
    { "label": "Second Option", "score": 85 },
    { "label": "Third Option", "score": 70 }
  ]
}

- Maintain a neutral, academic yet accessible tone in the 'text' field.
- If analyzing a file, use the file content as the primary source.
`;

export class AIService {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn("AIService initialized without API Key");
            this.genAI = null;
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
            // Using gemini-2.0-flash-exp for best performance and availability on v1beta
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            this.chat = this.model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: "System Prompt: " + SYSTEM_PROMPT }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood. I am ready to serve as your knowledgeable encyclopedia assistant." }],
                    },
                ],
            });
        }
    }

    async sendMessage(message, fileContext = null, retries = 3, onRetry = () => { }) {
        if (!this.genAI) {
            throw new Error("API Key is missing. Please configure it in settings.");
        }

        let parts = [{ text: message }];

        // Handle Attachments
        if (fileContext) {
            if (fileContext.isBinary) {
                // Remove header from base64 string
                const base64Data = fileContext.data.split(',')[1];
                parts.unshift({
                    inlineData: {
                        data: base64Data,
                        mimeType: fileContext.mimeType
                    }
                });
            } else {
                // Text file
                const content = fileContext.data || fileContext;
                const fullMessage = `Here is the file content provided by the user for analysis:\n\n---\n${content}\n---\n\nUser Question: ${message}`;
                parts = [{ text: fullMessage }];
            }
        }

        const messages = [
            {
                role: "user",
                parts: [{ text: "System Prompt: " + SYSTEM_PROMPT }],
            },
            {
                role: "model",
                parts: [{ text: "Understood. I am ready to serve as your knowledgeable encyclopedia assistant." }],
            },
            {
                role: "user",
                parts: parts
            }
        ];

        for (let i = 0; i < retries; i++) {
            try {
                // Send parts array
                const result = await this.chat.sendMessage(parts);
                const response = await result.response;
                const text = response.text();

                // Cleanup potentially markdown-wrapped JSON
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    return JSON.parse(cleanText);
                } catch (e) {
                    // Fallback if model fails to output JSON
                    console.error("JSON Parse Error:", e);
                    return {
                        text: text,
                        sources: ["Unknown"],
                        confidence_score: 0,
                        analysis: { intent: "Unknown", context: "Failed to parse structured response" },
                        recommendations: []
                    };
                }
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                const errorMessage = error.message || "Unknown error occurred";

                // Handle 429 Rate Limit or 503
                if (errorMessage.includes("429") || errorMessage.includes("503")) {
                    if (i < retries - 1) {
                        // Longer backoff: 2s, 4s, 8s
                        const delay = Math.pow(2, i + 1) * 1000;
                        console.log(`Rate limit hit. Retrying in ${delay}ms...`);
                        if (onRetry) onRetry(delay);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }

                if (errorMessage.includes("403")) throw new Error("API Key is invalid or has expired.");
                if (errorMessage.includes("404")) throw new Error("Model not found. Please check your API key permissions.");
                if (errorMessage.includes("429")) throw new Error("Gemini Quota Exceeded. Please wait, or switch to 'Llama 3 (Local)' in Settings for unlimited usage.");
                throw new Error(errorMessage);
            }
        }
    }
}
