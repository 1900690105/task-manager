import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export const generateTaskDescription = async (taskTitle) => {
  try {
    logger.info("Generating AI description", taskTitle);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
    });

    const prompt = `
Generate a short productive task description for:
"${taskTitle}"

Keep it under 50 words.
`;

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    logger.info("AI Generated Successfully", text);

    return text;
  } catch (error) {
    logger.error("Gemini API Failed", error);

    return "Failed to generate AI description";
  }
};
