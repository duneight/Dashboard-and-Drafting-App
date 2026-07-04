// NHL seasons start in October and are labelled by their starting year
// (season "2025" = Oct 2025 – Jun 2026), so Jan–Sept belong to the
// previous year's season. Not new Date().getFullYear() — that's wrong
// for nine months of the year.
export function getCurrentNhlSeason(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed: 9 = Oct
  return (month < 9 ? year - 1 : year).toString()
}
