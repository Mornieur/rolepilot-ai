export function targetCompanyDatabaseMessage(isDuplicate: boolean) {
  return isDuplicate ? "This provider and board identifier are already configured." : "Target companies are unavailable right now. Please try again.";
}
