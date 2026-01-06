
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

export class GroqService {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn("GroqService initialized without API Key");
        }
        this.apiKey = apiKey;
        this.baseUrl = "https://api.groq.com/openai/v1/chat/completions";
    }

    async sendMessage(message, fileContext = null) {
        if (!this.apiKey) {
            throw new Error("Groq API Key is missing. Please configure it in settings.");
        }

        let model = "llama-3.1-70b-versatile"; // Default fast text model
        const messages = [
            { role: "system", content: SYSTEM_PROMPT }
        ];

        // Format User Message
        const userContent = [];

        // Add File Context
        if (fileContext) {
            if (fileContext.isBinary) {
                // Image/Vision Request
                // Switch to Vision Model
                model = "llava-v1.5-7b-4096-preview";

                userContent.push({ type: "text", text: message });
                userContent.push({
                    type: "image_url",
                    image_url: {
                        url: fileContext.data // Data URL is supported by Groq/OpenAI format
                    }
                });
            } else {
                // Text File
                const content = fileContext.data || fileContext;
                const fullText = `Here is the file content provided by the user for analysis:\n\n---\n${content}\n---\n\nUser Question: ${message}`;
                userContent.push({ type: "text", text: fullText });
            }
        } else {
            // Simple Text Message
            userContent.push({ type: "text", text: message });
        }

        messages.push({ role: "user", content: userContent });

        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: messages,
                    model: model,
                    temperature: 0.5,
                    max_tokens: 1024,
                    stream: false,
                    response_format: { type: "json_object" } // Force JSON mode if supported, but prompt handles it too
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Groq API Error:", errorData);
                throw new Error(errorData.error?.message || `Groq API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.choices[0].message.content;

            // Parse JSON with fallback
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                return JSON.parse(cleanText);
            } catch (e) {
                console.warn("Groq JSON parse failed, returning raw text wrap");
                return {
                    text: text,
                    sources: ["Groq LLM"],
                    confidence_score: 90,
                    analysis: { intent: "Unknown", context: "Groq Inference" },
                    recommendations: []
                };
            }

        } catch (error) {
            console.error("Groq Service Error:", error);
            throw error;
        }
    }
}
