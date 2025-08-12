import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

function toYmdUtcPlus3(now: Date): string {
  // UTC+3
  const ms = now.getTime() + 3 * 60 * 60 * 1000;
  const shifted = new Date(ms);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const summaryGlobal = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db.query("globalStats").first();
    return {
      conversations: doc?.conversations ?? 0,
      accounts: doc?.accounts ?? 0,
      revenue: doc?.revenue ?? 0,
    };
  },
});

export const whoAmI = query({
  args: {},
  handler: async (ctx) => {
    const uid = await getAuthUserId(ctx);
    const user = uid ? await ctx.db.get(uid) : null;
    return { email: user?.email ?? null };
  },
});

export const setStatsForDate = mutation({
  args: {
    date: v.string(),
    conversations: v.number(),
    accounts: v.number(),
    revenue: v.number(),
  },
  handler: async (ctx, args) => {
    // Only admin can set
    const uid = await getAuthUserId(ctx);
    const user = uid ? await ctx.db.get(uid) : null;
    if (!user || user.email !== "youthful.swordfish892@mail.com") {
      throw new Error("Forbidden");
    }

    const existing = await ctx.db
      .query("statsByDate")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        conversations: args.conversations,
        accounts: args.accounts,
        revenue: args.revenue,
      });
      return existing._id;
    }
    return await ctx.db.insert("statsByDate", args);
  },
});

export const setGlobalStats = mutation({
  args: {
    conversations: v.number(),
    accounts: v.number(),
    revenue: v.number(),
  },
  handler: async (ctx, args) => {
    const uid = await getAuthUserId(ctx);
    const user = uid ? await ctx.db.get(uid) : null;
    if (!user || user.email !== "youthful.swordfish892@mail.com") {
      throw new Error("Forbidden");
    }
    const existing = await ctx.db.query("globalStats").first();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert("globalStats", args);
  },
});

export const getAutopumpSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("autopumpSettings").first();
    if (settings) return settings;
    // Defaults (не сохраняем в БД из query)
    return {
      enabled: false,
      revenueMinStep: 0,
      revenueMaxStep: 0,
      revenueIntervalSeconds: 10,
      revenueCap: 0,
      conversationsMinStep: 0,
      conversationsMaxStep: 0,
      conversationsIntervalSeconds: 10,
      conversationsCap: 0,
      accountsMinStep: 0,
      accountsMaxStep: 0,
      accountsIntervalSeconds: 10,
      accountsCap: 0,
      timezoneOffsetMinutes: 180,
    } as any;
  },
});

export const updateAutopumpSettings = mutation({
  args: {
    enabled: v.boolean(),
    revenueMinStep: v.number(),
    revenueMaxStep: v.number(),
    revenueIntervalSeconds: v.number(),
    revenueCap: v.number(),
    conversationsMinStep: v.number(),
    conversationsMaxStep: v.number(),
    conversationsIntervalSeconds: v.number(),
    conversationsCap: v.number(),
    accountsMinStep: v.number(),
    accountsMaxStep: v.number(),
    accountsIntervalSeconds: v.number(),
    accountsCap: v.number(),
  },
  handler: async (ctx, args) => {
    const uid = await getAuthUserId(ctx);
    const user = uid ? await ctx.db.get(uid) : null;
    if (!user || user.email !== "youthful.swordfish892@mail.com") {
      throw new Error("Forbidden");
    }

    const current = await ctx.db.query("autopumpSettings").first();
    if (!current) {
      await ctx.db.insert("autopumpSettings", {
        ...args,
        timezoneOffsetMinutes: 180,
      });
    } else {
      await ctx.db.patch(current._id, {
        ...args,
      });
    }

    // Ensure background job is ticking
    await ctx.scheduler.runAfter(0, internal.stats.autopumpTick, {});
  },
});

export const autopumpTick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("autopumpSettings").first();
    const nowMs = Date.now();
    const minIntervalSec = Math.max(
      1,
      Math.min(
        settings?.revenueIntervalSeconds ?? 10,
        settings?.conversationsIntervalSeconds ?? 10,
        settings?.accountsIntervalSeconds ?? 10
      )
    );

    if (!settings || !settings.enabled) {
      // Reschedule check a bit later to react to future enables
      await ctx.scheduler.runAfter(minIntervalSec * 1000, internal.stats.autopumpTick, {});
      return;
    }

    const existing = await ctx.db.query("globalStats").first();
    const targetId = existing
      ? existing._id
      : await ctx.db.insert("globalStats", {
          conversations: 0,
          accounts: 0,
          revenue: 0,
        });

    const doc = existing ?? (await ctx.db.get(targetId))!;

    const randBetween = (min: number, max: number) => {
      if (max <= min) return min;
      return Math.floor(min + Math.random() * (max - min + 1));
    };
    const updates: Partial<typeof doc> = {} as any;

    if (
      (settings.revenueMaxStep ?? 0) !== 0 &&
      nowMs - (settings.lastRevenueTickMs ?? 0) >=
        settings.revenueIntervalSeconds * 1000
    ) {
      const step = randBetween(settings.revenueMinStep ?? 0, settings.revenueMaxStep ?? 0);
      const limit = settings.revenueCap ?? 0;
      const next = doc.revenue + step;
      updates.revenue = limit > 0 ? Math.min(next, limit) : next;
      settings.lastRevenueTickMs = nowMs;
    }
    if (
      (settings.conversationsMaxStep ?? 0) !== 0 &&
      nowMs - (settings.lastConversationsTickMs ?? 0) >=
        settings.conversationsIntervalSeconds * 1000
    ) {
      const step = randBetween(settings.conversationsMinStep ?? 0, settings.conversationsMaxStep ?? 0);
      const limit = settings.conversationsCap ?? 0;
      const next = doc.conversations + step;
      updates.conversations = limit > 0 ? Math.min(next, limit) : next;
      settings.lastConversationsTickMs = nowMs;
    }
    if (
      (settings.accountsMaxStep ?? 0) !== 0 &&
      nowMs - (settings.lastAccountsTickMs ?? 0) >=
        settings.accountsIntervalSeconds * 1000
    ) {
      const step = randBetween(settings.accountsMinStep ?? 0, settings.accountsMaxStep ?? 0);
      const limit = settings.accountsCap ?? 0;
      const next = doc.accounts + step;
      updates.accounts = limit > 0 ? Math.min(next, limit) : next;
      settings.lastAccountsTickMs = nowMs;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(targetId, updates as any);
      // persist last tick fields
      const currentSettings = await ctx.db
        .query("autopumpSettings")
        .first();
      if (currentSettings) {
        await ctx.db.patch(currentSettings._id, {
          lastRevenueTickMs: settings.lastRevenueTickMs,
          lastConversationsTickMs: settings.lastConversationsTickMs,
          lastAccountsTickMs: settings.lastAccountsTickMs,
        });
      }
      // Патч globalStats пробуждает потребителей summaryGlobal автоматически
    }

    await ctx.scheduler.runAfter(minIntervalSec * 1000, internal.stats.autopumpTick, {});
  },
});


