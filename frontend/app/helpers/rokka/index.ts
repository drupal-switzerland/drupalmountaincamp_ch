/** Rokka renders an image only when the file is on rokka and a host is set. */
export function canRenderWithRokka(
  hash: string | null | undefined,
  host: string | null | undefined,
): boolean {
  return !!hash && !!host
}
