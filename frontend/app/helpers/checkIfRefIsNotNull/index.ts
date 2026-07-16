export function checkIfRefIsNotNull<T>(e: Ref<T | null>): e is Ref<T> {
  return e && e.value !== null
}
