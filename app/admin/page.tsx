"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  // Простая защита на клиенте; реальную защиту держим в серверных функциях
  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const settings = useQuery(api.stats.getAutopumpSettings, {});
  const update = useMutation(api.stats.updateAutopumpSettings);
  const setStats = useMutation(api.stats.setStatsForDate);
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({});
  const [savingFlags, setSavingFlags] = useState<Record<string, boolean>>({});

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [conversations, setConversations] = useState<number>(0);
  const [accounts, setAccounts] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);

  // Подтягиваем значения за выбранную дату
  const dayTotals = useQuery(api.stats.summaryByDateRange, { startDate: date, endDate: date });
  useEffect(() => {
    if (dayTotals) {
      setConversations(dayTotals.conversations ?? 0);
      setAccounts(dayTotals.accounts ?? 0);
      setRevenue(dayTotals.revenue ?? 0);
    }
  }, [date, dayTotals?.conversations, dayTotals?.accounts, dayTotals?.revenue]);

  if (settings === undefined) return null;

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Настройка</h1>

      <Card>
        <CardHeader className="font-medium">Задать показатели на дату</CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col">
            <Label className="text-sm">Дата</Label>
            <input className="border rounded-md p-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <NumberField label="Разговоры" value={conversations} onChange={setConversations} />
          <NumberField label="Аккаунты" value={accounts} onChange={setAccounts} />
          <NumberField label="Выручка" value={revenue} onChange={setRevenue} />
          <SaveButton
            label="Сохранить"
            saved={!!savedFlags["dateValues"]}
            saving={!!savingFlags["dateValues"]}
            onClick={async () => {
              setSavingFlags((s) => ({ ...s, dateValues: true }));
              await setStats({ date, conversations, accounts, revenue });
              setSavingFlags((s) => ({ ...s, dateValues: false }));
              setSavedFlags((s) => ({ ...s, dateValues: true }));
              setTimeout(() =>
                setSavedFlags((s) => ({ ...s, dateValues: false })), 2000);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="font-medium">Автоподкрутчик</CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <input
              id="enabled"
              type="checkbox"
              checked={settings?.enabled ?? false}
              onChange={async (e) => {
                setSavingFlags((s) => ({ ...s, enabled: true }));
                await update({
                  enabled: e.target.checked,
                  revenueMinStep: settings?.revenueMinStep ?? 0,
                  revenueMaxStep: settings?.revenueMaxStep ?? 0,
                  revenueIntervalSeconds: settings?.revenueIntervalSeconds ?? 10,
                  revenueDailyCap: settings?.revenueDailyCap ?? 0,
                  conversationsMinStep: settings?.conversationsMinStep ?? 0,
                  conversationsMaxStep: settings?.conversationsMaxStep ?? 0,
                  conversationsIntervalSeconds: settings?.conversationsIntervalSeconds ?? 10,
                  conversationsDailyCap: settings?.conversationsDailyCap ?? 0,
                  accountsMinStep: settings?.accountsMinStep ?? 0,
                  accountsMaxStep: settings?.accountsMaxStep ?? 0,
                  accountsIntervalSeconds: settings?.accountsIntervalSeconds ?? 10,
                  accountsDailyCap: settings?.accountsDailyCap ?? 0,
                });
                setSavingFlags((s) => ({ ...s, enabled: false }));
                setSavedFlags((s) => ({ ...s, enabled: true }));
                setTimeout(() => setSavedFlags((s) => ({ ...s, enabled: false })), 1500);
              }}
            />
            <label htmlFor="enabled">Включен</label>
            <StateBadge saving={!!savingFlags["enabled"]} saved={!!savedFlags["enabled"]} />
          </div>

          <Stepper
            title="Выручка"
            interval={settings?.revenueIntervalSeconds ?? 10}
            minStep={settings?.revenueMinStep ?? 0}
            maxStep={settings?.revenueMaxStep ?? 0}
            dailyCap={settings?.revenueDailyCap ?? 0}
            onChange={async (s, i) => {
              setSavingFlags((f) => ({ ...f, revenue: true }));
              await update({
                enabled: settings?.enabled ?? false,
                revenueMinStep: s.minStep,
                revenueMaxStep: s.maxStep,
                revenueIntervalSeconds: i,
                revenueDailyCap: s.dailyCap,
                conversationsMinStep: settings?.conversationsMinStep ?? 0,
                conversationsMaxStep: settings?.conversationsMaxStep ?? 0,
                conversationsIntervalSeconds: settings?.conversationsIntervalSeconds ?? 10,
                conversationsDailyCap: settings?.conversationsDailyCap ?? 0,
                accountsMinStep: settings?.accountsMinStep ?? 0,
                accountsMaxStep: settings?.accountsMaxStep ?? 0,
                accountsIntervalSeconds: settings?.accountsIntervalSeconds ?? 10,
                accountsDailyCap: settings?.accountsDailyCap ?? 0,
              });
              setSavingFlags((f) => ({ ...f, revenue: false }));
              setSavedFlags((f) => ({ ...f, revenue: true }));
              setTimeout(() => setSavedFlags((f) => ({ ...f, revenue: false })), 1500);
            }}
          />

          <Stepper
            title="Разговоры"
            interval={settings?.conversationsIntervalSeconds ?? 10}
            minStep={settings?.conversationsMinStep ?? 0}
            maxStep={settings?.conversationsMaxStep ?? 0}
            dailyCap={settings?.conversationsDailyCap ?? 0}
            onChange={async (s, i) => {
              setSavingFlags((f) => ({ ...f, conversations: true }));
              await update({
                enabled: settings?.enabled ?? false,
                revenueMinStep: settings?.revenueMinStep ?? 0,
                revenueMaxStep: settings?.revenueMaxStep ?? 0,
                revenueIntervalSeconds: settings?.revenueIntervalSeconds ?? 10,
                revenueDailyCap: settings?.revenueDailyCap ?? 0,
                conversationsMinStep: s.minStep,
                conversationsMaxStep: s.maxStep,
                conversationsIntervalSeconds: i,
                conversationsDailyCap: s.dailyCap,
                accountsMinStep: settings?.accountsMinStep ?? 0,
                accountsMaxStep: settings?.accountsMaxStep ?? 0,
                accountsIntervalSeconds: settings?.accountsIntervalSeconds ?? 10,
                accountsDailyCap: settings?.accountsDailyCap ?? 0,
              });
              setSavingFlags((f) => ({ ...f, conversations: false }));
              setSavedFlags((f) => ({ ...f, conversations: true }));
              setTimeout(() => setSavedFlags((f) => ({ ...f, conversations: false })), 1500);
            }}
          />

          <Stepper
            title="Аккаунты"
            interval={settings?.accountsIntervalSeconds ?? 10}
            minStep={settings?.accountsMinStep ?? 0}
            maxStep={settings?.accountsMaxStep ?? 0}
            dailyCap={settings?.accountsDailyCap ?? 0}
            onChange={async (s, i) => {
              setSavingFlags((f) => ({ ...f, accounts: true }));
              await update({
                enabled: settings?.enabled ?? false,
                revenueMinStep: settings?.revenueMinStep ?? 0,
                revenueMaxStep: settings?.revenueMaxStep ?? 0,
                revenueIntervalSeconds: settings?.revenueIntervalSeconds ?? 10,
                revenueDailyCap: settings?.revenueDailyCap ?? 0,
                conversationsMinStep: settings?.conversationsMinStep ?? 0,
                conversationsMaxStep: settings?.conversationsMaxStep ?? 0,
                conversationsIntervalSeconds: settings?.conversationsIntervalSeconds ?? 10,
                conversationsDailyCap: settings?.conversationsDailyCap ?? 0,
                accountsMinStep: s.minStep,
                accountsMaxStep: s.maxStep,
                accountsIntervalSeconds: i,
                accountsDailyCap: s.dailyCap,
              });
              setSavingFlags((f) => ({ ...f, accounts: false }));
              setSavedFlags((f) => ({ ...f, accounts: true }));
              setTimeout(() => setSavedFlags((f) => ({ ...f, accounts: false })), 1500);
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-slate-500">{label}</label>
      <input
        className="border rounded-md p-2"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Stepper({
  title,
  minStep,
  maxStep,
  dailyCap,
  interval,
  onChange,
}: {
  title: string;
  minStep: number;
  maxStep: number;
  dailyCap: number;
  interval: number;
  onChange: (s: { minStep: number; maxStep: number; dailyCap: number }, interval: number) => void;
}) {
  const [minS, setMinS] = useState<number>(minStep);
  const [maxS, setMaxS] = useState<number>(maxStep);
  const [cap, setCap] = useState<number>(dailyCap);
  const [i, setI] = useState<number>(interval);
  useEffect(() => setMinS(minStep), [minStep]);
  useEffect(() => setMaxS(maxStep), [maxStep]);
  useEffect(() => setCap(dailyCap), [dailyCap]);
  useEffect(() => setI(interval), [interval]);
  return (
    <div className="border rounded-lg p-4">
      <div className="font-medium mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <NumberField label="Мин. шаг" value={minS} onChange={setMinS} />
        <NumberField label="Макс. шаг" value={maxS} onChange={setMaxS} />
        <NumberField label="Дневной лимит" value={cap} onChange={setCap} />
        <NumberField label="Интервал, сек" value={i} onChange={setI} />
        <SaveButton
          className="col-span-2"
          onClick={() => onChange({ minStep: minS, maxStep: maxS, dailyCap: cap }, i)}
          label="Сохранить"
        />
      </div>
    </div>
  );
}

function SaveButton({
  onClick,
  label,
  saved,
  saving,
  className,
}: {
  onClick: () => Promise<void> | void;
  label: string;
  saved?: boolean;
  saving?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`h-10 px-4 rounded-md text-white ${
        saving ? "bg-slate-400" : saved ? "bg-green-600" : "bg-black"
      } ${className ?? ""}`}
      onClick={() => void onClick()}
      disabled={saving}
    >
      {saving ? "Сохранение…" : saved ? "Сохранено" : label}
    </button>
  );
}

function StateBadge({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saving) return <span className="text-xs text-slate-500">Сохранение…</span>;
  if (saved) return <span className="text-xs text-green-600">Сохранено</span>;
  return null;
}


