import type { UIMatch } from 'react-router';

/** Extra information a route can declare about itself via `handle`. */
export interface RouteHandle {
  /** Shows the reporting-month picker in the top bar. */
  usesReportingMonth?: boolean;
}

export function routeUsesReportingMonth(matches: readonly UIMatch[]): boolean {
  return matches.some((match) => {
    const handle = match.handle as RouteHandle | undefined;
    return handle?.usesReportingMonth === true;
  });
}
