export function nonNull<T>(v: T): v is NonNullable<T> {
  return !!v;
}

export function filter<T>(v: T[]) {
  return v.filter(Boolean) as NonNullable<T[]>;
}
