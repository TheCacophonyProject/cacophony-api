declare namespace Cypress {
  interface Chainable {
    /**
     * check the this device is reported as stopped or not
     *
     */
    checkPowerEvents(
      user: string,
      camera: string,
      stopoped: boolean,
      adminUsers?: string[] | null
    ): Chainable<Element>;
  }
}
