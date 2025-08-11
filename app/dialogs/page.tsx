"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Conversation = {
  conversation_id: number;
  username: string | null;
  bot_alias: string;
  last_created_at: string;
  project: string;
  messages_count: number;
  last_message: string;
};

type Message = {
  is_user_message: boolean;
  is_bot_message: boolean;
  created_at: string;
  text: string;
  username: string | null;
  bot_alias: string;
};

async function fetchConversations(limit: number, offset: number): Promise<{ conversations: Conversation[]; total_count: number; }> {
  const res = await fetch(`https://python-platforma-max-personal.reflectai.pro/coversation/list?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

async function fetchChat(conversationId: number, project: string): Promise<{ messages: Message[] }> {
  const url = `https://python-platforma-max-personal.reflectai.pro/coversation?conversation_id=${conversationId}&project_name=${encodeURIComponent(project)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load chat");
  return res.json();
}

export default function DialogsPage() {
  const [limit, setLimit] = useState(15);
  const [page, setPage] = useState(1);
  const offset = (page - 1) * limit;
  const [data, setData] = useState<{ conversations: Conversation[]; total_count: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<{ id: number; project: string; username: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchConversations(limit, offset)
      .then(setData)
      .finally(() => setLoading(false));
  }, [limit, offset]);

  useEffect(() => {
    if (!open || !active) return;
    setMessages(null);
    fetchChat(active.id, active.project).then((r) => setMessages(r.messages));
  }, [open, active?.id, active?.project]);

  const totalPages = useMemo(() => (data ? Math.max(1, Math.ceil(data.total_count / limit)) : 1), [data, limit]);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Диалоги</h1>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="text-sm text-slate-500">Всего: {data?.total_count ?? "…"}</div>
          <div className="flex items-center gap-2 text-sm">
            <span>На странице:</span>
            <select
              className="border rounded-md p-1"
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              {[15, 25, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Переписка</th>
                  <th className="py-2">Роль</th>
                  <th className="py-2">Клиент</th>
                  <th className="py-2">Бот</th>
                  <th className="py-2">Сообщения</th>
                  <th className="py-2">Проект</th>
                  <th className="py-2">Время</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Загрузка…</td></tr>
                )}
                {!loading && data?.conversations.map((c) => (
                  <tr key={c.conversation_id} className="border-t">
                    <td className="py-3">
                      <Button size="sm" onClick={() => { setActive({ id: c.conversation_id, project: c.project, username: c.username }); setOpen(true); }}>Чат</Button>
                    </td>
                    <td className="py-3"><span className="px-2 py-1 text-xs rounded-full bg-slate-100">{c.username ? "Продавец" : "Менеджер"}</span></td>
                    <td className="py-3">{c.username ?? "—"}</td>
                    <td className="py-3">{c.bot_alias}</td>
                    <td className="py-3">{c.messages_count}</td>
                    <td className="py-3">{c.project}</td>
                    <td className="py-3">{new Date(c.last_created_at).toLocaleString("ru-RU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</Button>
            <div className="text-sm">{page} / {totalPages}</div>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Вперёд</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переписка {active?.username ? `с ${active.username}` : ""}</DialogTitle>
            <div className="text-xs text-slate-500">{active?.project}</div>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto p-4 space-y-3">
            {!messages && <div className="text-center text-slate-500">Загрузка чата…</div>}
            {messages?.slice().reverse().map((m, idx) => (
              <div key={idx} className={`max-w-[85%] ${m.is_user_message ? "ml-auto bg-slate-100" : "mr-auto bg-green-100/60"} rounded-2xl px-3 py-2`}> 
                <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                <div className="text-[10px] text-slate-500 mt-1">{new Date(m.created_at).toLocaleString("ru-RU")}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}


