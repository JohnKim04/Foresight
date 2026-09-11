import { OutcomeCheckIn, OutcomeValue } from "./journal-storage";

const labels: Record<OutcomeValue, string> = {
  "-2": "Much worse",
  "-1": "A little worse",
  0: "About the same",
  1: "A little better",
  2: "Much better",
};

export function formatOutcomeValue(value: OutcomeValue): string {
  return labels[value];
}

export function formatOutcomeSummary(checkIn: OutcomeCheckIn): string {
  if (checkIn.status === "not_sure") return "Not sure yet";
  if (checkIn.status === "answered" && checkIn.overall !== null) return formatOutcomeValue(checkIn.overall);
  return "No response yet";
}
