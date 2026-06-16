import { useQuery } from '@tanstack/react-query'
import { loadTournament, availableTournaments, type TournamentData } from './tournament'
import { getSettings } from './settings'

export type TournamentMap = Record<string, TournamentData | null>

// Loads every enabled tournament and re-polls on the configured interval.
// Keeps the previous data visible during refetches (last-good on flaky wifi).
export function useTournaments() {
  const avail = availableTournaments()
  const refetchInterval = Math.max(3, getSettings().refreshSeconds) * 1000

  return useQuery<TournamentMap>({
    queryKey: ['tournaments', avail.join(',')],
    queryFn: async () => {
      const out: TournamentMap = {}
      await Promise.all(
        avail.map(async (k) => {
          try {
            out[k] = await loadTournament(k)
          } catch {
            out[k] = null
          }
        })
      )
      return out
    },
    refetchInterval,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    staleTime: 0,
  })
}
