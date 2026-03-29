type ClassValue = string | number | null | undefined | false;

export function cn(...classNames: ClassValue[]) {
  return classNames.filter(Boolean).join(' ');
}
