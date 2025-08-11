"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
type DateRange = { from?: Date; to?: Date } | undefined;

function ymd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Home() {
  // Показываем актуальные значения за сегодня (UTC+3), чтобы совпадали с автоподкрутчиком
  const data = useQuery(api.stats.summaryToday, {});

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Сводка</h1>
      <div className="text-sm text-slate-500">{format(new Date(), "dd.MM.yyyy")}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <KpiCard title="Разговоры" value={data?.conversations ?? 0} />
        <KpiCard title="Аккаунты" value={data?.accounts ?? 0} />
        <KpiCard title="Выручка" value={data?.revenue ?? 0} />
      </div>
    </main>
  );
}

import AnimatedNumbers from "react-animated-numbers";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";
function KpiCard({ title, value }: { title: string; value: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <Card>
      <CardHeader className="text-slate-500 text-sm">{title}</CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold mt-2 leading-none">
          {mounted ? (
            <AnimatedNumbers
              animateToNumber={value}
              transitions={() => ({ type: "spring", duration: 0.6 })}
            />
          ) : (
            value
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Дейтпикер убран — показываем сводку за всё время
