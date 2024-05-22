import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';
import { increaseApiLimit, checkApiLimit } from '@/lib/api_limit';
// import { HttpProxyAgent } from 'http-proxy-agent';

// const proxyAgent = new HttpProxyAgent("https://127.0.0.1:7890/"); //这里是用的我的Clash的本地地址

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  // defaultHeaders: {
  //   "HTTP-Referer": $YOUR_SITE_URL, // Optional, for including your app on openrouter.ai rankings.
  //   "X-Title": $YOUR_SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
  // },
  // dangerouslyAllowBrowser: true,
});

// // Use Replicate
// async function query(data: { prompt: any; amount: any; resolution: any }) {
//   console.log('data in query:>> ', data);
//   // TODO: request several image at once
//   const { prompt, amount, resolution } = data;
//   const replicate = new Replicate();
//   const input = {
//     width: parseInt(resolution.slice(0, 3), 10),
//     height: parseInt(resolution.slice(4, 7), 10),
//     prompt,
//     refine: 'expert_ensemble_refiner',
//     apply_watermark: false,
//     num_inference_steps: 25,
//   };
//   const output = await replicate.run(
//     'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
//     { input }
//   );
//   return output;
// }

// // Use huggingface API
// async function query(data) {
// 	console.log('[IMAGE_QUERY]', data);
// 	const response = await fetch(
// 		"https://api-inference.huggingface.co/models/ehristoforu/dalle-3-xl-v2",
// 		{
// 			headers: { Authorization: "Bearer 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" },
// 			method: "POST",
// 			body: JSON.stringify(data),
// 		}
// 	);
// 	console.log('[IMAGE_RESPONSE]', response);
// 	const result = await response.blob();
// 	console.log('[IMAGE_RESULT]', result);
// 	return result;
// }

// User HG GTA5 api
async function query(data) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/ItsJayQz/GTA5_Artwork_Diffusion',
    {
      headers: {
        Authorization: 'Bearer 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',
      },
      method: 'POST',
      body: JSON.stringify(data),
      // agent: proxyAgent
    }
  );
  const output = await response.blob();
  return output;
}

export async function POST(req: Request) {
  try {
    const userId = auth();
    const body = await req.json();
    const { prompt, amount, resolution } = body;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!prompt) {
      return new NextResponse('prompt is required', { status: 400 });
    }

    if (!amount) {
      return new NextResponse('amount is required', { status: 400 });
    }

    if (!resolution) {
      return new NextResponse('resolution is required', { status: 400 });
    }

    const freeTrial = await checkApiLimit();

    if (!freeTrial) {
      return new NextResponse('Free trial expired', { status: 403 });
    }

    const response = await query({ prompt, amount, resolution });

    // const response = await openai.chat.completions.create({
    //   // model: "gpt-3.5-turbo",
    //   // model: "google/gemini-pro-1.5",
    //   model: "mistralai/mistral-7b-instruct:free",
    //   messages
    // });

    await increaseApiLimit();

    console.log('response :>> ', response);
    return new NextResponse(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.log('[IMAGE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
