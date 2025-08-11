"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:block bg-gradient-to-br from-slate-900 to-black text-white p-10">
        <div className="max-w-md mt-20">
          <h1 className="text-4xl font-semibold">Leadbee Dashboard</h1>
          <p className="mt-4 text-slate-300">Войдите или зарегистрируйтесь, чтобы просматривать сводку и диалоги</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form
          className="w-full max-w-md space-y-4 bg-white/60 backdrop-blur p-6 rounded-2xl border"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", flow);
            void signIn("password", formData)
              .catch((error) => {
                setError(error.message);
              })
              .then(() => {
                router.push("/");
              });
          }}
        >
          <h2 className="text-2xl font-semibold">{flow === "signIn" ? "Вход" : "Регистрация"}</h2>
          <div className="grid gap-2">
            <label className="text-sm">Email</label>
            <input
              className="border rounded-md p-2"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Пароль</label>
            <input
              className="border rounded-md p-2"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          <button className="w-full h-10 rounded-md bg-black text-white">{flow === "signIn" ? "Войти" : "Зарегистрироваться"}</button>
          <div className="flex items-center justify-between text-sm">
            <span>{flow === "signIn" ? "Нет аккаунта?" : "Уже есть аккаунт?"}</span>
            <button
              className="underline"
              type="button"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Зарегистрироваться" : "Войти"}
            </button>
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2 text-sm">
              Ошибка: {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
