import { BaseCache } from "./base.cache";

const CONVERSATION_CACHE_TTL = 60;

export const ConversationCache = {
  for(userId: string) {
    return new BaseCache(
      `conversations:${userId}`,
      CONVERSATION_CACHE_TTL
    );
  },
};