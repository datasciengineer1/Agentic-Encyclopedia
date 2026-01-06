import { CreateMLCEngine } from "@mlc-ai/web-llm";

// Using a standard, pre-configured model ID from web-llm defaults.
// This avoids manual URL configuration which can cause Cache/CORS errors.
const SELECTED_MODEL = "Llama-3-8B-Instruct-q4f32_1-MLC";

const SYSTEM_PROMPT = `
You are an advanced, helpful, and knowledgeable encyclopedia assistant.
Your goal is to provide accurate, concise, and engaging information on any topic.

CRITICAL INSTRUCTION: You must ALWAYS respond in valid JSON format. Just return the raw JSON object.

The JSON structure must be:
{
  "text": "Your main conversational response here",
  "sources": ["List of sources"],
  "confidence_score": 95, 
  "analysis": { "intent": "intent", "context": "context" },
  "recommendations": [ { "label": "Rec 1", "score": 98 } ]
}
`;

export class LocalAIService {
    constructor(selectedModel, onProgress = () => { }) {
        this.engine = null;
        this.onProgress = onProgress;
        this.isLoaded = false;
        // Default to Llama 3 if not provided
        this.selectedModel = selectedModel || "Llama-3-8B-Instruct-q4f32_1-MLC";
    }

    async initialize() {
        if (this.engine) return;

        try {
            console.log(`Initializing Local Engine with ${this.selectedModel}...`);

            this.engine = await CreateMLCEngine(
                this.selectedModel,
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

        const isVisionModel = this.selectedModel.toLowerCase().includes("vision") || this.selectedModel.toLowerCase().includes("llava");

        // Handle Vision Request on Non-Vision Model
        if (fileContext && fileContext.isBinary && !isVisionModel) {
            return {
                text: "I cannot see images currently because I am using a text-only model. Please switch to **Phi 3.5 Vision** in Settings > Local AI to enable Vision.",
                sources: ["System Warning"],
                confidence_score: 100,
                analysis: { intent: "Image Analysis", context: "Model Capability Mismatch" },
                recommendations: []
            };
        }

        const messages = [
            { role: "system", content: SYSTEM_PROMPT }
        ];

        if (fileContext && fileContext.isBinary && isVisionModel) {
            // Vision Request with Llava
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: message },
                    {
                        type: "image_url",
                        image_url: { url: fileContext.data } // Base64 Data URL
                    }
                ]
            });
        } else {
            // Text Request
            let fullMessage = message;
            if (fileContext) {
                const content = fileContext.data || fileContext;
                fullMessage = `Here is the file content provided by the user for analysis:\n\n---\n${content}\n---\n\nUser Question: ${message}`;
            }
            messages.push({ role: "user", content: fullMessage });
        }

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
