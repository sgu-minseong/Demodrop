export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function assertNonEmpty(value: string, message: string) {
  if (!value.trim()) {
    throw new Error(message);
  }
}
