import { Ref } from "vue";

export async function useLoading<T = void>(
  loadingRef: Ref<boolean>,
  fn: () => Promise<T>,
  onError?: (e: unknown) => void
) {
  try {
    loadingRef.value = true;
    return await fn();
  } catch (e) {
    onError?.(e);
    throw e;
  } finally {
    loadingRef.value = false;
  }
}

export async function useNullableLoading<T = void>(
  loadingRef: Ref<unknown | null>,
  fn: () => Promise<T>,
  onError?: (e: unknown) => void
) {
  try {
    return await fn();
  } catch (e) {
    onError?.(e);
    throw e;
  } finally {
    loadingRef.value = null;
  }
}
