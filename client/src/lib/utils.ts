export function formatShells(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
