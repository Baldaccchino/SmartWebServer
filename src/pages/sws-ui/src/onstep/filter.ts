export function nonNull<T>(v: T): v is NonNullable<T> {
  return !!v;
}
