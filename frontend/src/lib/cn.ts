export function cn(...classNames: Array<string | null | undefined | false>) {
  return classNames.filter(Boolean).join(' ');
}

