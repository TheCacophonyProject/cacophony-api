export function logTestDescription(
  message: string,
  consoleObject: any,
  log = true
) {
  if (!log) {
    return;
  }

  Cypress.log({
    name: "Test description",
    displayName: "TEST",
    message: `**${message}**`,
    consoleProps: () => consoleObject
  });
}

