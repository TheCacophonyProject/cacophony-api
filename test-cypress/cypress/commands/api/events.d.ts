interface ComparablePowerEvent {
  hasStopped: boolean;
  hasAlerted: boolean;
}

declare namespace Cypress {
  interface Chainable {
    /**
     * check the this device is reported as stopped or not
     *
     */
    checkPowerEvents(
      user: string,
      camera: string,
      expectedEvent: ComparablePowerEvent
    ): Chainable<Element>;
  }
}
