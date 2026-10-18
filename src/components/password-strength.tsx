import { checkPasswordRules, passwordStrength } from "@/lib/password-policy";

const levels = [
  { label: "很弱", color: "bg-red-500", text: "text-red-600" },
  { label: "弱", color: "bg-orange-400", text: "text-orange-600" },
  { label: "普通", color: "bg-yellow-400", text: "text-yellow-700" },
  { label: "強", color: "bg-green-600", text: "text-green-700" },
];

export default function PasswordStrength({ password }: { password: string }) {
  const rules = checkPasswordRules(password);
  const strength = passwordStrength(password);
  const level = levels[strength];

  return (
    <div className="flex flex-col gap-2 font-normal" aria-live="polite">
      {password && (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {levels.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= strength ? level.color : "bg-line"}`}
              />
            ))}
          </div>
          <span className={`text-xs font-medium ${level.text}`}>密碼強度：{level.label}</span>
        </div>
      )}
      <ul className="flex flex-col gap-1 text-xs">
        {rules.map((rule) => (
          <li key={rule.id} className={rule.passed ? "text-green-700" : "text-ink/50"}>
            <span aria-hidden className="mr-1.5 inline-block w-3">
              {rule.passed ? "✓" : "○"}
            </span>
            {rule.label}
            <span className="sr-only">{rule.passed ? "（已符合）" : "（未符合）"}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink/50">
        建議使用 12 個字元以上，且不要和其他網站用同一組密碼。
      </p>
    </div>
  );
}
