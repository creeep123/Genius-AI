import { auth } from '@clerk/nextjs';

import prismadb from './prismadb';
import { MAX_FREE_COUNTS } from '@/constant';

/**
 * 增加用户的 API 调用次数限制，每次调用增加 1。
 * 如果用户已经存在，则增加他的调用次数；如果用户不存在，则创建一个新的记录，调用次数初始化为 1。
 *
 * @return {Promise<void>} 一个 Promise，当函数执行完成后被解析。
 */

// 这个函数用来ApiLimit是否已经达到了上限（MAX_FREE_COUNTS）
export const checkApiLimit = async () => {
  const { userId } = auth();
  if (!userId) {
    return false;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId },
  });

  if (!userApiLimit || userApiLimit.count < MAX_FREE_COUNTS) {
    return true;
  } else {
    return false;
  }
};

// 获取当前用户的 ApiLimit
export const getApiLimitCount = async () => {
  const { userId } = auth();

  if (!userId) {
    return 0;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: {
      userId,
    },
  });

  if (!userApiLimit) {
    return 0;
  }

  return userApiLimit.count;
};
