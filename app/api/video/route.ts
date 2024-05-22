import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { increaseApiLimit,checkApiLimit } from '@/lib/api_limit';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

export async function POST(req: Request) {
  try {
    const userId = auth();
    const body = await req.json();
    const { prompt } = body;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const freeTrial = await checkApiLimit();

    if(!freeTrial){
      return new NextResponse('Free trial expired', { status: 403 });
    }

    const input = {
      path: 'toonyou_beta3.safetensors',
      seed: 0,
      steps: 25,
      prompt,
      n_prompt:
        'badhandv4, easynegative, ng_deepnegative_v1_75t, verybadimagenegative_v1.3, bad-artist, bad_prompt_version2-neg, teeth',
      motion_module: 'mm_sd_v14',
      guidance_scale: 7.5,
    };
    const response = await replicate.run(
      'lucataco/animate-diff:beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f',
      {
        input,
      }
    );
    
    await increaseApiLimit();

    console.log('response :>> ', response);
    return new NextResponse(JSON.stringify(response), {
      status: 200,
    });
  } catch (error) {
    console.log('[VIDEO_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
