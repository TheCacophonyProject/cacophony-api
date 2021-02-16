// load the global Cypress types
/// <reference types="cypress" />

interface thermalRecording {
    recordingDateTime: Date,
    

    
}

declare namespace Cypress {
    interface Chainable {
    
        /**
         * upload a recording to for a particular camera
        */
       uploadRecording(cameraname: string, log?: boolean): Chainable<Element>

       form_request(method: string, url: string, jwt: string, formData: any, done:any): Chainable<Element>

    }
}
