export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value.trim()) {
    return {
      ok: false,
      message: `${fieldName} is required.`,
    };
  }

  return { ok: true };
}
