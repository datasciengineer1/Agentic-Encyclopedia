import { CreateMLCEngine } from "@mlc-ai/web-llm";

// Using a standard, pre-configured model ID from web-llm defaults.
// This avoids manual URL configuration which can cause Cache/CORS errors.
const SELECTED_MODEL = "Llama-3-8B-Instruct-q4f32_1-MLC";

const SYSTEM_PROMPT = `
You are an advanced, helpful, and knowledgeable encyclopedia assistant.
Your goal is to provide accurate, concise, and engaging information on any topic.

CRITICAL INSTRUCTION: You must ALWAYS respond in valid JSON format. Do not include markdown code blocks (like \`\`\`json). Just return the raw JSON object.

The JSON structure must be:
{
  "text": "Your main conversational response here (markdown supported)",
  "sources": ["List of sources or 'General Knowledge' if common info"],
  "confidence_score": 95, 
  "analysis": {
    "intent": "Briefly describe user intent",
    "context": "Brief context summary"
  },
  "recommendations": [
    { "label": "Top Recommendation", "score": 98 },
    { "label": "Second Option", "score": 85 },
    { "label": "Third Option", "score": 70 }
  ]
}

- Maintain a neutral, academic tone.
- If analyzing a file, use the file content as source.
`;

export class LocalAIService {
    constructor(onProgress = () => { }) {
        this.engine = null;
        this.onProgress = onProgress;
        this.isLoaded = false;
    }

    async initialize() {
        if (this.engine) return;

        try {
            console.log("Initializing Local Engine...");
            // We do NOT pass appConfig here. We rely on the library's internal registry.
            // This ensures we get the correct URLs that support the required CORS/COEP headers.
            this.engine = await CreateMLCEngine(
                SELECTED_MODEL,
                {
                    initProgressCallback: (progress) => {
                        console.log("Model Progress:", progress);
                        this.onProgress(progress);
                    },
                    logLevel: "INFO"
                }
            );
            this.isLoaded = true;
            console.log("Local Engine Loaded.");
        } catch (error) {
            console.error("Failed to load local engine:", error);
            throw error;
        }
    }

    async sendMessage(message, fileContext = null, retries = 0, onRetry = () => { }) {
        if (!this.engine) {
            await this.initialize();
        }

        // Local Llama 3 is text-only
        if (fileContext && fileContext.isBinary) {
            return {
                text: "I cannot see images or PDFs when running locally (Llama 3 is text-only). Please switch to **Gemini (Cloud)** in Settings to analyze these files.",
                sources: ["System Warning"],
                confidence_score: 100,
                analysis: { intent: "File Analysis", context: "Unsupported in Local Mode" },
                recommendations: []
            };
        }

        let fullMessage = message;
        if (fileContext) {
            const content = fileContext.data || fileContext;
            fullMessage = `Here is the file content provided by the user for analysis:\n\n---\n${content}\n---\n\nUser Question: ${message}`;
        }

        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: fullMessage }
        ];

        try {
            const response = await this.engine.chat.completions.create({
                messages,
                temperature: 0.7,
                max_tokens: 1024,
            });

            const text = response.choices[0].message.content;

            // Parse JSON with fallback
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(cleanText);
            } catch (e) {
                console.warn("Local JSON parse failed, returning raw text wrap");
                return {
                    text: text,
                    sources: ["Local Knowledge"],
                    confidence_score: 80,
                    analysis: { intent: "Unknown", context: "Local Inference" },
                    recommendations: []
                };
            }
        } catch (error) {
            console.error("Local Inference Error:", error);
            throw error;
        }
    }
}
