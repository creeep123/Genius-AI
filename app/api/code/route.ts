import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { increaseApiLimit,checkApiLimit } from '@/lib/api_limit';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  // defaultHeaders: {
  //   "HTTP-Referer": $YOUR_SITE_URL, // Optional, for including your app on openrouter.ai rankings.
  //   "X-Title": $YOUR_SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
  // },
  // dangerouslyAllowBrowser: true,
})

const instructionMessage  = {
  role: "system",
  content: "You are a code generator, you must answer in markdown format, use code comments for explanations.",
}

export async function POST(req: Request) {
  try {
    const userId = auth();
    const body = await req.json();
    const { messages } = body;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const freeTrial = await checkApiLimit();

    if(!freeTrial){
      return new NextResponse('Free trial expired', { status: 403 });
    }

    const response = await openai.chat.completions.create({
      // model: "gpt-3.5-turbo",
      // model: "google/gemini-pro-1.5",
      model: "mistralai/mixtral-8x22b:free",
      messages: [instructionMessage, ...messages]
    });

    await increaseApiLimit();

    return new NextResponse(JSON.stringify(response.choices[0].message), { status: 200 });
  } catch (error) {
    console.log('[CONVERSATION_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

