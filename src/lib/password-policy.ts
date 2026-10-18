// 前端（即時提示）和後端（實際檢查）共用同一套規則
export const MIN_PASSWORD_LENGTH = 8;
export const STRONG_PASSWORD_LENGTH = 12;
// bcrypt 只會用到前 72 bytes，超過的部分會被忽略
const MAX_PASSWORD_BYTES = 72;

export type PasswordRule = { id: string; label: string; passed: boolean };

export function checkPasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: "length",
      label: `至少 ${MIN_PASSWORD_LENGTH} 個字元`,
      passed: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      id: "case",
      label: "包含大寫和小寫英文字母",
      passed: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { id: "digit", label: "包含數字", passed: /\d/.test(password) },
    {
      id: "symbol",
      label: "包含特殊符號，例如 ! @ # $ %",
      passed: /[^A-Za-z0-9\s]/.test(password),
    },
  ];
}

// 回傳第一個沒通過的規則說明，全部通過則回傳 null
export function passwordError(password: string): string | null {
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return "密碼太長了，請縮短一點。";
  }
  const failed = checkPasswordRules(password).find((rule) => !rule.passed);
  return failed ? `密碼強度不足：需要${failed.label}。` : null;
}

// 0 = 很弱、1 = 弱、2 = 普通、3 = 強
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  const passed = checkPasswordRules(password).filter((rule) => rule.passed).length;
  if (passed < 3) return 0;
  if (passed < 4) return 1;
  return password.length >= STRONG_PASSWORD_LENGTH ? 3 : 2;
}
