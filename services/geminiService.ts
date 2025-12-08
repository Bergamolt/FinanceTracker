import { GoogleGenAI, Chat, GenerateContentResponse, Tool } from "@google/genai";
import { FinancialState } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the user's financial state to provide insights and debt repayment strategies.
 */
export const analyzeFinances = async (data: FinancialState): Promise<string> => {
  const ai = getAI();
  
  const prompt = `
    Ты опытный финансовый советник. Проанализируй следующие финансовые данные в формате JSON.
    
    Данные:
    ${JSON.stringify(data, null, 2)}
    
    Пожалуйста, предоставь подробный отчет на РУССКОМ языке в формате Markdown, включающий:
    1. **Оценка финансового здоровья**: Оценка от 0 до 100 на основе соотношения долга к доходу и сбережений.
    2. **Стратегия погашения долгов**: Предложи план (Снежный ком или Лавина) для погашения долгов, конкретно упоминая названия долгов.
    3. **Достижимость целей**: Проанализируй, реалистичны ли финансовые цели с учетом текущих доходов и расходов.
    4. **Рекомендации**: 3 конкретных шага для улучшения ситуации.
    
    Тон должен быть ободряющим, но профессиональным. Используй эмодзи там, где это уместно.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Не удалось сгенерировать анализ в данный момент.";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "Ошибка генерации анализа. Пожалуйста, проверьте ваш API ключ.";
  }
};

/**
 * Creates a chat session with context about the user's finances.
 */
export const createFinancialChat = (data: FinancialState, tools?: Tool[]): Chat => {
  const ai = getAI();
  
  const systemInstruction = `
    Ты FinanceBot, полезный и умный финансовый помощник, использующий Gemini 3.0 Pro.
    У тебя есть доступ к текущим финансовым данным пользователя, приведенным ниже.
    ВСЕГДА отвечай на РУССКОМ языке.
    ВСЕГДА ссылайся на конкретные цифры, долги и цели пользователя при ответе.
    
    Финансовый контекст пользователя:
    ${JSON.stringify(data)}
    
    У тебя есть инструменты (tools) для добавления доходов, расходов, долгов и целей.
    Если пользователь просит добавить что-то или присылает список трат/доходов, используй соответствующие инструменты.
    Если пользователь присылает список, вызови инструменты для каждого пункта.
    
    Если пользователь спрашивает о погашении долга, объясни плюсы и минусы его конкретной ситуации.
    Если пользователь спрашивает об обмене валют, дай общий совет, но предупреди, что курсы колеблются.
    Будь кратким, полезным и дружелюбным.
  `;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction,
      tools: tools,
    },
  });
};