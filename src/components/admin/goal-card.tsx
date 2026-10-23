"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { setGoal, type ActionResult } from "@/app/admin/actions";
import { MAX_GOAL } from "@/lib/goals";
import { MailIcon, UserPlusIcon, UsersIcon } from "@/components/icons";
import { HeadingIcon } from "@/components/admin/ui";

const METRIC_ICONS: Record<string, typeof UsersIcon> = {
  members: UsersIcon,
  members_month: UserPlusIcon,
  subscribers: MailIcon,
  subscribers_month: MailIcon,
};

type Props = {
  metric: string;
  label: string;
  unit: string;
  href: string;
  value: number;
  target: number | null;
  // 每月目標會顯示「10 月・每月目標」
  hint?: string;
};

// 總覽的目標進度卡：大大的百分比 + 一條進度條，管理者可以直接修改目標
export default function GoalCard({ metric, label, unit, href, value, target, hint }: Props) {
  const Icon = METRIC_ICONS[metric] ?? UsersIcon;
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await setGoal(prev, formData);
      if (result.ok) setEditing(false);
      return result;
    },
    null,
  );

  // 用無條件捨去，避免還差一點點就顯示 100%
  const percent = target ? Math.floor((value / target) * 100) : 0;
  const reached = target !== null && value >= target;

  function submit(clear = false) {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    if (clear) formData.set("target", "");
    startTransition(() => formAction(formData));
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/25 bg-white p-6 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-navy to-brand" />
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="flex items-center gap-2 text-sm text-ink/50 hover:text-ink">
          <HeadingIcon size="sm">
            <Icon className="h-4 w-4" />
          </HeadingIcon>
          {label} →
        </Link>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-brand/30 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-brand hover:bg-brand-soft"
          >
            {target ? "修改目標" : "設定目標"}
          </button>
        )}
      </div>

      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}

      {editing ? (
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <input type="hidden" name="metric" value={metric} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
            目標{label}
            <div className="flex items-center gap-2">
              <input
                name="target"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_GOAL}
                step={1}
                required
                autoFocus
                defaultValue={target ?? ""}
                placeholder="例如 100"
                className="w-full rounded-xl border border-line px-4 py-2.5 text-ink outline-none focus:border-brand"
              />
              <span className="shrink-0 text-sm font-normal text-ink/50">{unit}</span>
            </div>
          </label>
          {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-brand-navy px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy/85 disabled:opacity-60"
            >
              {pending ? "儲存中" : "儲存"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink"
            >
              取消
            </button>
            {target && (
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={pending}
                className="ml-auto text-xs text-ink/40 underline underline-offset-4 hover:text-red-600"
              >
                取消目標
              </button>
            )}
          </div>
        </form>
      ) : target ? (
        <>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
            <p className="text-4xl font-black tabular-nums text-brand-navy">
              {percent}
              <span className="ml-0.5 text-xl font-bold text-ink/50">%</span>
            </p>
            <p className="pb-1 text-sm tabular-nums text-ink/60">
              <span className="font-bold text-brand-navy">{value.toLocaleString()}</span> /{" "}
              {target.toLocaleString()} {unit}
            </p>
          </div>
          {/* 進度條：超過目標時停在滿格 */}
          <div
            role="progressbar"
            aria-label={`${label}目標進度`}
            aria-valuemin={0}
            aria-valuemax={target}
            aria-valuenow={Math.min(value, target)}
            aria-valuetext={`${value} / ${target} ${unit}，達成 ${percent}%`}
            className={`mt-3 h-2 overflow-hidden rounded-full ${reached ? "bg-green-100" : "bg-brand-soft"}`}
          >
            <div
              // 達標時進度條變綠色，和「已達成目標」同色
              className={`h-full rounded-full transition-[width,background-color] duration-700 ${
                reached ? "bg-green-600" : "bg-brand"
              }`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink/50">
            {reached ? (
              <span className="font-medium text-green-700">✓ 已達成目標</span>
            ) : (
              `還差 ${(target - value).toLocaleString()} ${unit}`
            )}
          </p>
          {state?.ok && <p className="mt-1 text-xs text-green-700">{state.message}</p>}
        </>
      ) : (
        <div className="mt-3">
          <p className="text-3xl font-black tabular-nums text-brand-navy">
            {value.toLocaleString()}
            <span className="ml-1 text-base font-bold text-ink/50">{unit}</span>
          </p>
          <p className="mt-2 text-xs text-ink/40">
            {state?.ok ? state.message : "還沒設定目標，設定後會顯示達成率。"}
          </p>
        </div>
      )}
    </div>
  );
}
