export type TopLevelRoute = "journal" | "check-ins" | "trends";

export type JournalRoute =
  | { screen: "journal" }
  | { screen: "check-ins" }
  | { screen: "trends" }
  | { screen: "detail"; entryId: string }
  | { screen: "outcome-check-in"; entryId: string; checkInId: string | null; origin: "detail" | "check-ins" }
  | { screen: "schedule-check-in"; entryId: string; checkInId: string | null; origin: "detail" | "check-ins" }
  | { screen: "composer"; mode: "new"; origin: "journal" }
  | { screen: "composer"; mode: "edit"; origin: "detail"; entryId: string };

export const journalRoute: JournalRoute = { screen: "journal" };

export function topLevelRoute(screen: TopLevelRoute): JournalRoute {
  return { screen };
}

export function openDetail(entryId: string): JournalRoute {
  return { screen: "detail", entryId };
}

export function openNewComposer(): JournalRoute {
  return { screen: "composer", mode: "new", origin: "journal" };
}

export function openOutcomeCheckIn(entryId: string, checkInId: string | null, origin: "detail" | "check-ins" = "detail"): JournalRoute {
  return { screen: "outcome-check-in", entryId, checkInId, origin };
}

export function openScheduleCheckIn(entryId: string, checkInId: string | null, origin: "detail" | "check-ins" = "detail"): JournalRoute {
  return { screen: "schedule-check-in", entryId, checkInId, origin };
}

export function openEditComposer(entryId: string): JournalRoute {
  return { screen: "composer", mode: "edit", origin: "detail", entryId };
}

export function leaveFocusedRoute(route: JournalRoute): JournalRoute {
  if (route.screen === "detail") return journalRoute;
  if (route.screen === "outcome-check-in" || route.screen === "schedule-check-in") return route.origin === "detail" ? openDetail(route.entryId) : topLevelRoute("check-ins");
  if (route.screen === "composer") return route.origin === "detail" ? openDetail(route.entryId) : journalRoute;
  return route;
}

export function routeAfterSave(entryId: string): JournalRoute {
  return openDetail(entryId);
}

export function resolveRoute(route: JournalRoute, entryIds: ReadonlySet<string>, checkInIds: ReadonlySet<string> = new Set()): JournalRoute {
  if (route.screen === "detail" && !entryIds.has(route.entryId)) return journalRoute;
  if ((route.screen === "outcome-check-in" || route.screen === "schedule-check-in") && (!entryIds.has(route.entryId) || (route.checkInId !== null && !checkInIds.has(route.checkInId)))) return journalRoute;
  if (route.screen === "composer" && route.mode === "edit" && !entryIds.has(route.entryId)) return journalRoute;
  return route;
}
