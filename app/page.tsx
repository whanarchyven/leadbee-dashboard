"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
// date picker and utilities removed

export default function Home() {
  // Глобальные значения без сброса по дням
  const data = useQuery(api.stats.summaryGlobal, {});

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
