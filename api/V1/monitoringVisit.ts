import moment, { Moment } from "moment";

const MINUTE = 60;
const MAX_SECS_BETWEEN_RECORDINGS = 10 * MINUTE;

const currentVisitForDevice : {
    [key: number]: Visit;
} = {};

const allVisits : Visit[] = [];

interface Visit {
    events?: any[];
    what?: string;
    end?: Moment;
    start?: Moment; 
    device: any;
};
  

// // generates visits from a list of recordings in descending date time order
// export function generateVisits(recordings: any[]) {
//     for (const [i, rec] of recordings.entries()) {
//         let currentVisit : Visit = currentVisitForDevice[rec.DeviceId] || {};
//         if (currentVisit &&  !currentVisit.isPartOfVisit(trackPeriod.trackStart)) {
//           currentVisit.completeVisit();
//         } else {
//             if (currentVisit) {
//             }
//             const newVisit : Visit = {};
//             currentVisit.addRecording(rec, userID);
//           allVisits.push(newVisit);
//         }
//         currentVisitForDevice[rec.DeviceId] = newVisit;            
//     }
// }

// export getLastMovement(recording: any) {
//     a.data.start_s != undefined 

// }

// function isWithinVisitInterval(firstTime: Moment, secondTime: Moment): boolean {
//     return Math.abs(firstTime.diff(secondTime, "seconds")) < MAX_SECS_BETWEEN_RECORDINGS
// }
  

// calculateNewVisits(
//     rec: any,
//     complete: boolean = false,
//     userID: number
//   ): Visit[] {
//     sortTracks(rec.Tracks);
//     if (rec.Tracks.length == 0) {
//       return this.visits;
//     }
//     //check earliest track in recording is within interval of current visit
//     const trackPeriod = new TrackStartEnd(rec, rec.Tracks[0]);
//         const currentVisit = this.currentVisit();
//     if (currentVisit && currentVisit.isPartOfVisit(trackPeriod.trackStart)) {
//       currentVisit.addRecording(rec, userID);
//       currentVisit.queryOffset = queryOffset;
//     } else {
//       if (currentVisit) {
//         currentVisit.completeVisit();
//       }
//       const visit = new Visit(rec, userID, queryOffset);
//       this.visits.push(visit);
//       this.visitCount++;
//     }
//     this.updateSummary(rec);
//     this.addAudioFileIds(rec);
//     return this.visits;
//   }
