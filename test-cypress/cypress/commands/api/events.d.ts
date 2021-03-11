declare namespace Cypress {
  interface Chainable {
    /**
     * check the this device is reported as stopped or not
     *
     */
    checkStopped(
      user: string,
      camera: string,
      expected: boolean
    ): Chainable<Element>;
  }
}
