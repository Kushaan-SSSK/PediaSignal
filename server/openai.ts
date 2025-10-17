import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
// Validate API key at startup - don't allow fallback to default_key
const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
if (!apiKey) {
  throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
}

const openai = new OpenAI({
  apiKey
});

interface VitalsData {
  heartRate: number;
  temperature: number;
  respRate: number;
  bloodPressure?: string;
  oxygenSat?: number;
}

interface SimulationData {
  caseType: string;
  stage: number;
  vitals: VitalsData;
  intervention: string;
}

export async function generateClinicalExplanation(simulationData: SimulationData): Promise<{
  explanation: string;
  updatedVitals: VitalsData;
  nextStageRecommendations: string[];
}> {
  try {
    const prompt = `
You are an expert pediatric emergency medicine physician providing clinical explanations for medical training simulations.

Case: ${simulationData.caseType}
Current Stage: ${simulationData.stage}
Current Vitals: ${JSON.stringify(simulationData.vitals)}
Applied Intervention: ${simulationData.intervention}

Please provide:
1. A clinical explanation of the intervention's effects
2. Updated vital signs after the intervention
3. Recommendations for next steps

Respond in JSON format with: explanation, updatedVitals, nextStageRecommendations
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a pediatric emergency medicine expert providing training explanations. Always prioritize patient safety and evidence-based medicine."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      explanation: result.explanation || "Unable to generate explanation",
      updatedVitals: result.updatedVitals || simulationData.vitals,
      nextStageRecommendations: result.nextStageRecommendations || []
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate clinical explanation: " + (error as Error).message);
  }
}

export async function analyzeXrayImage(base64Image: string): Promise<{
  abuseLikelihood: number;
  fractureType: string | null;
  explanation: string;
  confidenceScore: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a pediatric radiologist specializing in detecting signs of child abuse in X-ray images. Analyze the image for fracture patterns, bone density, healing stages, and other indicators consistent with non-accidental trauma."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this pediatric X-ray for signs of potential child abuse. Look for suspicious fracture patterns, multiple fractures at different healing stages, metaphyseal corner fractures, spiral fractures in non-ambulatory children, or other concerning findings. Provide abuse likelihood (0-1), fracture type if present, detailed explanation, and confidence score. Respond in JSON format."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      abuseLikelihood: Math.max(0, Math.min(1, result.abuseLikelihood || 0)),
      fractureType: result.fractureType || null,
      explanation: result.explanation || "Unable to analyze image",
      confidenceScore: Math.max(0, Math.min(1, result.confidenceScore || 0))
    };
  } catch (error) {
    console.error("X-ray analysis error:", error);
    throw new Error("Failed to analyze X-ray: " + (error as Error).message);
  }
}

export async function classifyMisinformation(content: string, source: string): Promise<{
  riskScore: number;
  category: string;
  explanation: string;
  recommendedAction: string;
}> {
  try {
    const prompt = `
Analyze the following pediatric health content for misinformation:

Content: "${content}"
Source: ${source}

Evaluate for:
1. Medical accuracy regarding pediatric health
2. Potential harm to children if followed
3. Contradiction of established medical guidelines
4. Anti-vaccine sentiment
5. Dangerous home remedies

Provide risk score (0-1), category (vaccine, treatment, emergency_care, general), explanation, and recommended action.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a pediatric health misinformation expert. Analyze content for accuracy and potential harm to children's health."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      riskScore: Math.max(0, Math.min(1, result.riskScore || 0)),
      category: result.category || "general",
      explanation: result.explanation || "Unable to classify content",
      recommendedAction: result.recommendedAction || "Monitor for updates"
    };
  } catch (error) {
    console.error("Misinformation analysis error:", error);
    throw new Error("Failed to classify misinformation: " + (error as Error).message);
  }
}

export async function generateTriageResponse(parentMessage: string): Promise<{
  response: string;
  riskLevel: string;
  recommendedAction: string;
  emergencyWarning: boolean;
}> {
  try {
    const prompt = `
A parent has sent this message about their child's symptoms: "${parentMessage}"

As a pediatric triage AI assistant, provide:
1. A helpful, empathetic response
2. Risk assessment (low, medium, high, emergency)
3. Recommended action (home_care, call_doctor, urgent_care, emergency_room)
4. Whether emergency warning is needed

SAFETY FIRST: Always err on the side of caution for pediatric cases. High fevers, difficulty breathing, lethargy, dehydration, or severe symptoms require immediate medical attention.

Respond in JSON format.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a pediatric triage assistant. Always prioritize child safety and provide clear guidance to parents. Include emergency warnings when appropriate and never replace professional medical advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      response: result.response || "Please consult with a healthcare professional for medical advice.",
      riskLevel: result.riskLevel || "medium",
      recommendedAction: result.recommendedAction || "call_doctor",
      emergencyWarning: result.emergencyWarning || false
    };
  } catch (error) {
    console.error("Triage response error:", error);
    throw new Error("Failed to generate triage response: " + (error as Error).message);
  }
}
