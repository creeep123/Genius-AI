import {auth} from "@clerk/nextjs";

import prismadb from "./prismadb";

const DAYS_IN_MS = 86_400_000;

export const checkSubscription = async () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  const userSubscription = await prismadb.userSubscription.findUnique({
    where: {
      userId: userId
    },
    select:{
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
    }
  });

  if(!userSubscription){
    return false;
  }

  // 判断用户订阅是否有效，需要满足以下条件：
  // 1. stripePriceId不为空，表示用户有订阅产品。
  // 2. stripeCurrentPeriodEnd加上86400000毫秒（即1天）后的时间戳大于当前时间。
  //    这是因为Stripe返回的订阅结束时间是指下一个自然日0点的时间戳，
  //    如果当前时间大于下一个自然日0点的时间戳，那么用户订阅就已经过了。
  const isValid = 
    userSubscription.stripePriceId && 
    userSubscription.stripeCurrentPeriodEnd?.getTime()! + DAYS_IN_MS > Date.now();

  return !!isValid;
}