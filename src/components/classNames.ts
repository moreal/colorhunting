export function classNames(
  ...values: Array<false | null | string | undefined>
): string | undefined {
  const className = values.filter(Boolean).join(" ");

  return className === "" ? undefined : className;
}
