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
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [start, end] = useMemo(() => {
    const from = range?.from ?? new Date();
    const to = range?.to ?? range?.from ?? new Date();
    return [ymd(from), ymd(to)];
  }, [range]);

  const data = useQuery(api.stats.summaryByDateRange, {
    startDate: start,
    endDate: end,
  });

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Сводка</h1>
      <ShadDateRange value={range} onChange={setRange} />
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

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";

function ShadDateRange({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (v: DateRange | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const from = value?.from;
  const to = value?.to ?? value?.from;

  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label className="px-1">Диапазон дат</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-64 justify-between">
              <span>
                {from ? ymd(from) : "Выберите"}
                {to ? ` — ${ymd(to)}` : ""}
              </span>
              <CalendarIcon className="opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={{ from, to }}
              numberOfMonths={2}
              onSelect={(range) => onChange(range)}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button onClick={() => onChange(value)}>Загрузить</Button>
    </div>
  );
}
