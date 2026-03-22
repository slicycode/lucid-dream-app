export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  console.log('redirectSystemPath', path, initial);
  return '/';
}