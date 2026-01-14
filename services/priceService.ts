
import { GoogleGenAI, Type } from "@google/genai";
import type { PriceData, Timeframe, ComparisonOption, GroundingSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[] }> => {
  const prompt = `Fetch the most recent OHLC (Open, High, Low, Close) futures price data for Crude Palm Oil (FCPO) on Bursa Malaysia for the timeframe: ${timeframe}. 
  Provide the data as a JSON array of objects with fields: date (ISO string or YYYY-MM-DD), open, high, low, close. 
  If historical data for the full timeframe isn't available, provide as many recent data points as possible (up to 30).
  Ensure the prices are in MYR.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  open: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                  low: { type: Type.NUMBER },
                  close: { type: Type.NUMBER },
                },
                required: ["date", "open", "high", "low", "close"],
              },
            },
          },
        },
      },
    });

    const text = response.text;
    const parsed = JSON.parse(text || '{"prices": []}');
    
    // Extract grounding sources
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || 'Market Source',
            uri: chunk.web.uri
          });
        }
      });
    }

    return { 
      data: parsed.prices.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      sources 
    };
  } catch (error) {
    console.error("Error fetching real-time data:", error);
    throw error;
  }
};

export const fetchComparisonData = async (
  timeframe: Timeframe,
  comparison: ComparisonOption,
  referenceData: PriceData[]
): Promise<PriceData[]> => {
  if (comparison === 'NONE') return [];
  
  const target = comparison === 'SBO' ? 'Soybean Oil (SBO) Futures' : 'Previous Period FCPO';
  const prompt = `For comparison with FCPO, fetch the close prices for ${target} corresponding to these dates: ${referenceData.map(d => d.date).join(', ')}.
  Return a JSON array of objects with fields: date, close. Ensure the data is aligned with the provided dates.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comparisonData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  close: { type: Type.NUMBER },
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"comparisonData": []}');
    return parsed.comparisonData;
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    return [];
  }
};
