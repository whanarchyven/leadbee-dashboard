import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  // Дневные агрегаты показателей по дате (YYYY-MM-DD) — больше не используются для сводки
  statsByDate: defineTable({
    date: v.string(),
    conversations: v.number(),
    accounts: v.number(),
    revenue: v.number(),
  }).index("by_date", ["date"]),
  // Глобальные агрегаты (единые на всё время)
  globalStats: defineTable({
    conversations: v.number(),
    accounts: v.number(),
    revenue: v.number(),
  }),
  // Глобальные настройки автоподкрутчика (единственная запись)
  autopumpSettings: defineTable({
    enabled: v.boolean(),
    revenueMinStep: v.number(),
    revenueMaxStep: v.number(),
    revenueIntervalSeconds: v.number(),
    revenueCap: v.optional(v.number()),
    conversationsMinStep: v.number(),
    conversationsMaxStep: v.number(),
    conversationsIntervalSeconds: v.number(),
    conversationsCap: v.optional(v.number()),
    accountsMinStep: v.number(),
    accountsMaxStep: v.number(),
    accountsIntervalSeconds: v.number(),
    accountsCap: v.optional(v.number()),
    timezoneOffsetMinutes: v.number(),
    lastRevenueTickMs: v.optional(v.number()),
    lastConversationsTickMs: v.optional(v.number()),
    lastAccountsTickMs: v.optional(v.number()),
  }),
});
