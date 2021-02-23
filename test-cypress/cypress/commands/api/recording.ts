// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, uploadFile, DEFAULT_DATE } from "../server";
import { logTestDescription } from "../descriptions";

let lastUsedTime = DEFAULT_DATE;

Cypress.Commands.add(
  "uploadRecording",
  (cameraName: string, details: ThermalRecordingInfo, log = true) => {
    const data = makeRecordingDataFromDetails(details);

    logTestDescription(
      `Upload '${JSON.stringify(details)}' recording to '${cameraName}'`,
      { camera: cameraName, requestData: data },
      log
    );

    const fileName = "invalid.cptv";
    const url = v1ApiPath("recordings");
    const fileType = "application/cptv";

    uploadFile(url, cameraName, fileName, fileType, data);
    // must wait until the upload request has completed
    cy.wait(["@addRecording"]);
  }
);

type IsoFormattedDateString = string;

interface TrackData {
  start_s?: number;
  end_s?: number;
  confident_tag?: string;
  confidence?: number;
}

interface AlgorithmMetadata {
  model_name?: string;
}

interface ThermalRecordingMetaData {
  algorithm?: AlgorithmMetadata;
  tracks: TrackData[];
}

interface ThermalRecordingData {
  type: "thermalRaw";
  recordingDateTime: IsoFormattedDateString;
  duration: number;
  comment?: string;
  batteryLevel?: number;
  batteryCharging?: string;
  airplaneModeOn?: boolean;
  version?: string;
  additionalMetadata?: JSON;
  metadata?: ThermalRecordingMetaData;
}

function makeRecordingDataFromDetails(
  details: ThermalRecordingInfo
): ThermalRecordingData {
  let data: ThermalRecordingData = {
    type: "thermalRaw",
    recordingDateTime: "",
    duration: 12,
    comment: "uploaded by cypress"
  };

  if (details.duration) {
    data.duration = details.duration;
  }

  data.recordingDateTime = getDateForRecordings(details).toISOString();

  if (!details.noTracks) {
    const model = details.model ? details.model : "Master";
    addTracksToRecording(data, model, details.tracks);
  }

  return data;
}

function getDateForRecordings(details: ThermalRecordingInfo): Date {
  let date = lastUsedTime;

  if (details.time) {
    date = details.time;
  } else if (details.minsLater || details.secsLater) {
    let secs = 0;
    if (details.minsLater) {
      secs += details.minsLater * 60;
    }
    if (details.secsLater) {
      secs += details.secsLater;
    }
    date = new Date(date.getTime() + secs * 1000);
  } else {
    // add a minute anyway so we don't get two overlapping recordings on the same camera
    const MINUTE = 60;
    date = new Date(date.getTime() + MINUTE * 1000);
  }

  lastUsedTime = date;
  return date;
}

function addTracksToRecording(
  data: ThermalRecordingData,
  model: string,
  trackDetails?: TrackInfo[]
): void {
  data.metadata = {
    algorithm: {
      model_name: model
    },
    tracks: []
  };

  if (trackDetails) {
    data.metadata.tracks = trackDetails.map((track) => {
      let tag = track.tag ? track.tag : "possum";
      return {
        start_s: 2,
        end_s: 8,
        confident_tag: tag,
        confidence: 0.9
      };
    });
  } else {
    data.metadata.tracks.push({
      start_s: 2,
      end_s: 8,
      confident_tag: "possum",
      confidence: 0.5
    });
  }
}
