export type TopLevelRoute = "journal" | "trends";

export type JournalRoute =
  | { screen: "journal" }
  | { screen: "trends" }
  | { screen: "detail"; entryId: string }
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

export function openEditComposer(entryId: string): JournalRoute {
  return { screen: "composer", mode: "edit", origin: "detail", entryId };
}

export function leaveFocusedRoute(route: JournalRoute): JournalRoute {
  if (route.screen === "detail") return journalRoute;
  if (route.screen === "composer") return route.origin === "detail" ? openDetail(route.entryId) : journalRoute;
  return route;
}

export function routeAfterSave(entryId: string): JournalRoute {
  return openDetail(entryId);
}

export function resolveRoute(route: JournalRoute, entryIds: ReadonlySet<string>): JournalRoute {
  if (route.screen === "detail" && !entryIds.has(route.entryId)) return journalRoute;
  if (route.screen === "composer" && route.mode === "edit" && !entryIds.has(route.entryId)) return journalRoute;
  return route;
}
