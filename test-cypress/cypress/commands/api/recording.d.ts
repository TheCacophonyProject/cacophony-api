// load the global Cypress types
/// <reference types="cypress" />

interface trackInfo {
    // start_s? : 10,
    // end_s? : 22.2,
    tag?: string,
    // confidence?: number,
}


interface thermalRecordingInfo {
    time?: Date,
    duration?: number, 
    model?: string,
    tracks? : trackInfo[], 
    noTracks?: boolean,      // by default there will normally be one track, set to true if you don't want tracks
    minsLater?: number,      // minutes that later that the recording is taken
    secsLater?: number,      // minutes that later that the recording is taken
}

declare namespace Cypress {
    interface Chainable {
    
        /**
         * upload a single recording to for a particular camera
        */
       uploadRecording(cameraname: string, details : thermalRecordingInfo, log?: boolean): Chainable<Element>
    }
}
