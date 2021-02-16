// load the global Cypress types
/// <reference types="cypress" />

import {v1ApiPath, uploadFile } from "../server";
 
Cypress.Commands.add("uploadRecording", (cameraName: string, details: thermalRecordingInfo, log = true) => {
  if (log) {
    cy.log(`Uploading '${JSON.stringify(details)}' recording to '${cameraName}'`);
  }
  const fileName = 'invalid.cptv';
  const url = v1ApiPath('recordings');
  const fileType = 'application/cptv';
  const data = makeRecordingDataFromDetails(details);

  uploadFile(url, cameraName, fileName, fileType, data);
});

interface trackData {
  start_s? : number,
  end_s? : number,
  confident_tag?: string,
  confidence?: number,
}

interface algorithmMetadata {
  model_name? : string
}

interface thermalRecordingMetaData {
  algorithm? : algorithmMetadata,
  tracks : trackData[]
}

interface thermalRecordingData {
  type: "thermalRaw",
  recordingDateTime: string, 
  duration: number, 
  comment? : string,
  batteryLevel? : number, 
  batteryCharging? : string, 
  airplaneModeOn? : boolean, 
  version?: string, 
  additionalMetadata?: JSON,
  metadata?: thermalRecordingMetaData
}

function makeRecordingDataFromDetails(details: thermalRecordingInfo) : any {
  let data : thermalRecordingData = {
    "type": "thermalRaw", 
    "recordingDateTime": new Date().toISOString(), 
    "duration": 12, 
    "comment": "uploaded by cypress", 
  }

  if( details.duration ) {
    data.duration = details.duration;
  }

  if( details.time ) {
    data.recordingDateTime = details.time.toISOString();
  }

  if( !details.noTracks ) {
    const model = details.model ? details.model : "Master";
    addTracksToRecording(data, model, details.tracks);
  };

  return data;
}

function addTracksToRecording(data : thermalRecordingData, model: string, trackDetails?: trackInfo[]) : void {
  data.metadata = {
    "algorithm": {
      "model_name": model
     },
    "tracks": []
  }

  if (trackDetails) {
    trackDetails.forEach((track) => {
      const fullTrack : trackData = {
        start_s : 10,
        end_s : 22.2,
        confident_tag: "possum",
        confidence: .9,
      }
      if (track.tag) {
        fullTrack.confident_tag = track.tag;
      }

      data.metadata.tracks.push(fullTrack);
    }); 
  } else {
    data.metadata.tracks.push({
      start_s : 10,
      end_s : 22.2,
      confident_tag: "possum",
      confidence: .9,
    });
  }
}