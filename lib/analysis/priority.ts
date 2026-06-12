export function resolvePriority(count: number): [string, string] {
  if (count >= 7) {
    return ["Must Have", "FFCDD2"];
  }

  if (count >= 5) {
    return ["High", "FFE0B2"];
  }

  if (count >= 3) {
    return ["Useful", "FFF9C4"];
  }

  return ["Optional", "E8F5E9"];
}
