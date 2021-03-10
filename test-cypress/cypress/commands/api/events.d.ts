
const EventTypes = {
	POWERED_ON: "rpi-power-on",
	POWERED_OFF: "daytime-power-off",
	STOP_REPORTED: "stop-reported",
}

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
