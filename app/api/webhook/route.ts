import Stripe from 'stripe';
import { NextResponse } from 'next/server';

import prismadb from '@/lib/prismadb';
import {stripe} from '@/lib/stripe';

// 定义一个异步函数，用于处理POST请求
export async function POST(req: Request) {
  // 从请求中获取文本内容
  const body = await req.text();
  // 从请求头中获取Stripe签名
  const signature = req.headers.get('Stripe-Signature');
  // 获取环境变量中的Stripe webhook密钥
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  // 尝试构建Stripe事件
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (error: any) {
    // 如果构建失败，返回错误响应
    return new NextResponse(`Webhook error: ${error.message}`, { status: 400 });
  }

  // 获取事件数据中的结账会话对象
  const session = event.data.object as Stripe.Checkout.Session;

  // 如果事件类型为结账会话完成
  if (event.type === 'checkout.session.completed') {
    // 检索订阅信息
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // 如果会话元数据中没有用户ID，返回错误响应
    if (!session?.metadata?.userId) {
      return new NextResponse('User id is required', { status: 400 });
    }

    // 创建用户订阅记录
    await prismadb.userSubscription.create({
      data: {
        userId: session?.metadata?.userId,
      }
    });
  }

  // 如果事件类型为发票支付成功
  if (event.type === "invoice.payment_succeeded") {
    // 检索订阅信息
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // 更新用户订阅记录
    await prismadb.userSubscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  // 返回成功响应
  return new NextResponse(null, { status: 200 });
}
