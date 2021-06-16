export const NO_LOG_MESSAGE = false;

export function logTestDescription(
  message: string,
  consoleObject: any,
  log = true
) {
  if (!log) {
    return;
  }

  message = message.trim(); // needed to make sure the message shows in bold

  Cypress.log({
    name: "Test description",
    displayName: "TEST",
    message: `**${message}**`,
    consoleProps: () => consoleObject
  });
}

export function prettyLog(object: any) {
  if (!(object instanceof Array)) {
    const objectCopy: any = Object.assign({}, object);

    Object.keys(objectCopy).forEach((key) => {
      if (objectCopy[key] instanceof Date) {
        const date = objectCopy[key] as Date;
        objectCopy[key] = `${date.toLocaleDateString(
          "en-NZ"
        )} ${date.toLocaleTimeString("en-NZ")}`;
      }
    });
    object = objectCopy;
  }

  return JSON.stringify(object)
    .replaceAll('",', ", ")
    .replaceAll('"', "")
    .replaceAll("},", "} -  ");
}
