/*
This handles creation of Visits from recordings

A visit is a grouping of many viewings of the same species (animal, insect ...). As long as
they are seen again within eventMaxTimeSeconds of the last viewing

A Visit is made up of many VisitEvents.
VisitEvents are distinct viewings of a species, defined by a TrackTag

Unidentified tags may be assumed to be another species e.g. Possum if they occur within
eventMaxTimeSeconds of a defined species
*/

import { Recording } from "../../models/Recording";
import { TrackTag } from "../../models/TrackTag";
import { Track } from "../../models/Track";
import moment, { Moment } from "moment";
import { Event } from "../../models/Event";

let visitID = 1;
const eventMaxTimeSeconds = 60 * 10;
const aiName = "Master";
const unidentified = "unidentified";
const audioBaitInterval = 60 * 10;
interface AnimalMap {
  [key: string]: VisitSummary;
}

// getTrackTag from all tags return a single tag by precedence:
// this users tag, or any other humans tag, else the original AI
function getTrackTag(trackTags: TrackTag[], userID: number): TrackTag | null {
  if (trackTags.length == 0) {
    return null;
  }
  const manualTags = trackTags.filter((tag) => tag.automatic == false);
  if (manualTags.length > 0) {
    const userTag = manualTags.find((tag) => tag.UserId == userID);
    if (userTag) {
      return userTag;
    } else {
      return manualTags[0];
    }
  }

  const originalTags = trackTags.filter(
    (tag) => tag.data == null || tag.data.name == aiName
  );
  if (originalTags.length > 0) {
    return originalTags[0];
  } else {
    return null;
  }
}

class DeviceSummary {
  deviceMap: DeviceVisitMap;
  lastRecTime: Moment;
  constructor() {
    this.deviceMap = {};
  }

  // generates visits from a list of receordings in descending date time order
  generateVisits(
    recordings: any[],
    queryOffset: number,
    complete: boolean = false,
    userId: number
  ) {

    for (const [i, rec] of recordings.entries()) {
      this.lastRecTime = moment(rec.recordingDateTime);
      let devVisits = this.deviceMap[rec.DeviceId];
      if (!devVisits) {
        devVisits = new DeviceVisits(
          rec.Device.devicename,
          rec.Group.groupname,
          rec.DeviceId,
          userId
        );
        this.deviceMap[rec.DeviceId] = devVisits;
      }
      devVisits.calculateNewVisits(rec, queryOffset + i , complete);
    }
  }
  earliestIncompleteOffset(): number | null {
    var offset = null;
    for (const device of Object.values(this.deviceMap)) {
      for (var i = device.visits.length - 1; i >= 0; i--) {
        const visit = device.visits[i];
        if (!visit.incomplete) {
          break;
        }
        if (offset == null) {
          offset = visit.queryOffset;
        } else {
          offset = Math.min(offset, visit.queryOffset);
        }
      }
    }
    return offset;
  }
  checkForCompleteVisits() {
    for (const device of Object.values(this.deviceMap)) {
      device.checkForCompleteVisits(this.lastRecTime);
    }
  }
  markCompleted() {
    var visits = 0;
    for (const device of Object.values(this.deviceMap)) {
      for (var i = device.visits.length - 1; i >= 0; i--) {
        const visit = device.visits[i];
        if (!visit.incomplete) {
          break;
        }
        visit.incomplete = false;
      }
    }
  }
  completeVisitsCount(): number {
    var visits = 0;
    for (const device of Object.values(this.deviceMap)) {
      visits += device.visits.filter((v) => !v.incomplete).length;
    }
    return visits;
  }
  removeIncompleteVisits() {
    for (const device of Object.values(this.deviceMap)) {
      device.removeIncompleteVisits();
      if (device.visits.length == 0) {
        delete this.deviceMap[device];
      }
    }
  }
  audiFileIds(): Set<number> {
    const audioFileIds: Set<number> = new Set();

    for (const device of Object.values(this.deviceMap)) {
      device.audioFileIds.forEach((id) => audioFileIds.add(id));
    }
    return audioFileIds;
  }
  completeVisits(): Visit[] {
    var visits: Visit[] = [];
    for (const device of Object.values(this.deviceMap)) {
      visits.push(...device.visits.filter((v) => !v.incomplete));
    }
    return visits;
  }
}
class DeviceVisits {
  animals: AnimalMap;
  firstVisit: Visit | null;
  startTime: Moment;
  endTime: Moment;
  audioFileIds: Set<number>;
  visitCount: number;
  eventCount: number;
  audioBait: boolean;
  visits: Visit[];
  constructor(
    public deviceName: string,
    public groupName: string,
    public id: number,
    public userID: number
  ) {
    this.animals = {};
    this.firstVisit = null;
    this.audioFileIds = new Set();
    this.visitCount = 0;
    this.eventCount = 0;
    this.audioBait = false;
    this.visits = [];
  }
  checkForCompleteVisits(lastRecTime: Moment) {
    for (var i = this.visits.length - 1; i >= 0; i--) {
      const visit = this.visits[i];
      if (!visit.incomplete) {
        break;
      }
      visit.incomplete = isWithinVisitInterval(visit.start, lastRecTime);
    }
  }

  removeIncompleteVisits() {
    for (const [animal, visitSumary] of Object.entries(this.animals)) {
      const visitSummary = this.animals[animal];
      visitSummary.removeIncomplete();
      if (visitSummary.visits.length == 0) {
        delete this.animals[animal];
      }
    }
  }

  updateSummary(visit: Visit | VisitEvent) {
    this.audioBait = this.audioBait || visit.audioBaitDay;
    if (visit instanceof Visit) {
      this.visitCount += 1;
      this.eventCount += 1;
    } else {
      this.eventCount += 1;
    }

    if (!this.startTime || !this.endTime) {
      this.startTime = visit.start;
      this.endTime = visit.end;
    } else {
      if (this.startTime > visit.start) {
        this.startTime = visit.start;
      }

      if (this.endTime < visit.end) {
        this.endTime = visit.end;
      }
    }
  }

  calculateNewVisits(
    rec: any,
    queryOffset: number,
    complete: boolean = false
  ): Visit[] {
    const visits = [];

    const tracks = rec.Tracks;
    this.sortTracks(tracks);

    for (const track of tracks) {
      const event = this.calculateTrackTagEvent(rec, track);
      if (event == null) {
        continue;
      }
      this.updateSummary(event);
      if (event instanceof Visit) {
        const newVisit = event as Visit;
        newVisit.incomplete = !complete;
        newVisit.queryOffset = queryOffset;
        visits.push(newVisit);
      }
    }
    this.visits.push(...visits);
    return visits;
  }

  sortTracks(tracks: Track[]) {
    tracks.sort(function (a, b) {
      if (
        a.data &&
        b.data &&
        a.data.start_s != undefined &&
        b.data.start_s != undefined
      ) {
        const res = b.data.start_s - a.data.start_s;
        if (res == 0) {
          return b.id - a.id;
        } else {
          return res;
        }
      } else {
        return 0;
      }
    });
  }

  addAudioFileIds(item) {
    item.audioBaitEvents.forEach((audioEvent) => {
      this.audioFileIds.add(audioEvent.EventDetail.details.fileId);
    });
  }

  // calculateTrackTagEvent returns a newvisit if the track doesn't belong to any existing visits
  // otherwise it will add an event to an existing visit and return the new event
  calculateTrackTagEvent(
    rec: Recording,
    track: any
  ): null | Visit | VisitEvent {
    const tag = getTrackTag(track.TrackTags, this.userID);
    if (!tag) {
      return null;
    }

    const trackPeriod = new TrackStartEnd(rec, track);
    if (this.unknownIsPartOfPreviousVisit(tag, trackPeriod.trackEnd)) {
      return this.addEventToPreviousVisit(rec, track, tag);
    }

    return this.handleTag(rec, track, tag, trackPeriod);
  }

  addEventToPreviousVisit(
    rec: Recording,
    track: Track,
    tag: TrackTag
  ): VisitEvent | null {
    if (this.firstVisit == null) {
      return null;
    }

    const newEvent = this.firstVisit.addEvent(
      rec,
      track,
      tag,
      this.firstVisit.what != tag.what
    );
    this.addAudioFileIds(newEvent);
    return newEvent;
  }

  unknownIsPartOfPreviousVisit(tag: TrackTag, end: Moment): boolean {
    return (
      tag.what == unidentified &&
      this.firstVisit != null &&
      this.firstVisit.isPartOfVisit(end)
    );
  }

  handleTag(
    rec: Recording,
    track: Track,
    tag: TrackTag,
    trackPeriod: TrackStartEnd
  ): Visit | VisitEvent | null {
    let visitSummary = this.animals[tag.what];
    if (!visitSummary) {
      visitSummary = new VisitSummary(tag.what);
      this.animals[tag.what] = visitSummary;
    }
    const newItem = visitSummary.addTrackTag(rec, track, tag, trackPeriod);
    this.addAudioFileIds(newItem);

    if (newItem instanceof Visit) {
      if (tag.what != unidentified) {
        this.mergePreviousVisit(newItem as Visit);
      }
      this.firstVisit = newItem as Visit;
    }
    return newItem;
  }

  // as we get new visits previous unidentified events may need to be added to this visit
  mergePreviousVisit(visit: Visit) {
    const unVisit = this.firstVisit;
    if (unVisit && unVisit.what == unidentified) {
      let unEvent = unVisit.events[unVisit.events.length - 1];
      while (unEvent && isWithinVisitInterval(visit.end, unEvent.start)) {
        unEvent.wasUnidentified = true;
        visit.addEventAtIndex(unEvent, 0);
        unVisit.removeEventAtIndex(unVisit.events.length - 1);
        unEvent = unVisit.events[unVisit.events.length - 1];
      }

      if (unVisit.events.length == 0) {
        const unVisitSummary = this.animals[unidentified];
        unVisitSummary.visits.pop();
        this.visits.pop();
        if (unVisitSummary.visits.length == 0) {
          delete this.animals[unidentified];
        }
      }
    }
  }
}

class VisitSummary {
  visits: Visit[];
  end: Moment;
  start: Moment;
  constructor(public what: string) {
    this.visits = [];
  }

  removeIncomplete() {
    const prevLength = this.visits.length;
    this.visits = this.visits.filter((v) => !v.incomplete);
    if (prevLength != this.visits.length) {
      this.updateStart();
    }
  }

  updateStart() {
    const lastVisit = this.lastVisit();
    if (lastVisit != null) {
      this.start = lastVisit.start;
    }
  }

  addTrackTag(
    rec: Recording,
    track: Track,
    tag: TrackTag,
    trackPeriod: TrackStartEnd
  ): Visit | VisitEvent | null {
    if (this.isPartOfCurrentVisit(trackPeriod.trackEnd)) {
      const newEvent = this.addEventToCurrentVisit(rec, track, tag);
      return newEvent;
    }
    const visit = this.addVisit(rec, track, tag);
    return visit;
  }
  isPartOfCurrentVisit(time: Moment): boolean {
    const currentVisit = this.lastVisit();
    if (currentVisit == null) {
      return false;
    }
    return currentVisit.isPartOfVisit(time);
  }

  lastVisit(): Visit | null {
    if (this.visits.length == 0) {
      return null;
    }
    return this.visits[this.visits.length - 1];
  }

  addEventToCurrentVisit(
    rec: Recording,
    track: Track,
    tag: TrackTag,
    wasUnidentified: boolean = false
  ): VisitEvent | null {
    //add event to current visit
    const currentVisit = this.lastVisit();
    if (currentVisit == null) {
      return null;
    }
    const event = currentVisit.addEvent(rec, track, tag, wasUnidentified);
    if (!wasUnidentified) {
      this.start = event.start;
    }
    return event;
  }

  removeVisitAtIndex(index: number) {
    this.visits.splice(index, 1);
  }

  addVisit(rec: Recording, track: Track, tag: TrackTag): Visit {
    visitID += 1;
    const visit = new Visit(rec, track, tag, visitID);
    this.visits.push(visit);
    this.start = visit.end;
    if (this.visits.length == 1) {
      this.end = visit.start;
    }
    return visit;
  }
}

class Visit {
  id: number;
  events: VisitEvent[];
  what: string;
  end: Moment;
  start: Moment;
  queryOffset: number;
  deviceName: string;
  deviceId: number
  groupName: string;
  audioBaitDay: boolean;
  audioBaitVisit: boolean;
  audioBaitEvents: Event[];
  incomplete: boolean;
  constructor(rec: any, track: Track, tag: TrackTag, public visitID: number) {
    const event = new VisitEvent(rec, track, tag);
    this.events = [event];
    this.what = tag.what;
    this.end = event.end;
    this.start = event.start;
    this.deviceId = rec.Device.id;
    this.deviceName = rec.Device.devicename;
    this.groupName = rec.Group.groupname;
    this.audioBaitEvents = [];
    this.audioBaitVisit = false;
    this.audioBaitDay = false;
    this.setAudioBaitEvents(rec);
  }

  setAudioBaitEvents(rec) {
    let events = rec.Device.Events;
    if (!events) {
      return null;
    }

    events = events.filter(
      (e) => !this.audioBaitEvents.find((existing) => e.id == existing.id)
    );
    for (const event of events) {
      const eventTime = moment(event.dateTime);
      this.audioBaitDay =
        this.audioBaitDay ||
        eventTime.isSame(moment(rec.recordingDateTime), "day");
      if (
        Math.abs(eventTime.diff(this.start, "seconds")) <= audioBaitInterval &&
        eventTime.isBefore(this.end)
      ) {
        this.audioBaitVisit = true;
        this.audioBaitEvents.push(event);
      }
    }
  }

  updateAudioEvent(newEvent: VisitEvent) {
    const events = newEvent.audioBaitEvents.filter(
      (e) => !this.audioBaitEvents.find((existing) => e.id == existing.id)
    );

    this.audioBaitDay = this.audioBaitDay || newEvent.audioBaitDay;
    this.audioBaitVisit = this.audioBaitVisit || newEvent.audioBaitVisit;
    this.audioBaitEvents = events.concat(this.audioBaitEvents);
  }

  removeEventAtIndex(index: number) {
    this.events.splice(index, 1);
  }

  addEventAtIndex(newEvent: VisitEvent, index: number) {
    // should this update start time???
    this.updateAudioEvent(newEvent);
    this.events.splice(index, 0, newEvent);
    this.updateStartTime(newEvent);
  }

  updateStartTime(newEvent: VisitEvent) {
    if (!newEvent.wasUnidentified && newEvent.start < this.start) {
      this.start = newEvent.start;
    }
  }

  isPartOfVisit(eTime: Moment): boolean {
    return isWithinVisitInterval(this.start, eTime);
  }

  eventIsPartOfVisit(newEvent: VisitEvent): boolean {
    return isWithinVisitInterval(this.start, newEvent.end);
  }

  addEvent(rec, track, tag, wasUnidentified: boolean = false): VisitEvent {
    const event = new VisitEvent(rec, track, tag);
    this.updateAudioEvent(event);

    event.wasUnidentified = wasUnidentified;
    this.events.push(event);
    this.updateStartTime(event);

    return event;
  }
}

class VisitEvent {
  wasUnidentified: Boolean;
  recID: number;
  recStart: Moment;
  trackID: number;
  confidence: number;
  start: Moment;
  end: Moment;
  audioBaitDay: boolean;
  audioBaitEvents: Event[];
  audioBaitVisit: boolean;
  what: string;
  constructor(rec: Recording, track: Track, tag: TrackTag) {
    const trackTimes = new TrackStartEnd(rec, track);
    this.audioBaitDay = false;
    this.audioBaitVisit = false;
    this.wasUnidentified = false;
    this.recID = rec.id;
    this.audioBaitEvents = [];
    this.recStart = trackTimes.recStart;
    this.trackID = track.id;
    this.what = tag.what;
    if (tag.what != unidentified) {
      this.confidence = Math.round(tag.confidence * 100);
    } else {
      this.confidence = 0;
    }
    this.start = trackTimes.trackStart;
    this.end = trackTimes.trackEnd;

    this.setAudioBaitEvents(rec);
  }

  setAudioBaitEvents(rec) {
    let events = rec.Device.Events;
    if (!events) {
      return null;
    }
    for (const event of events) {
      const eventTime = moment(event.dateTime);
      this.audioBaitDay =
        this.audioBaitDay ||
        eventTime.isSame(moment(rec.recordingDateTime), "day");

      if (
        Math.abs(eventTime.diff(this.start, "seconds")) <= audioBaitInterval &&
        eventTime.isBefore(this.end)
      ) {
        this.audioBaitVisit = true;
        this.audioBaitEvents.push(event);
      }
    }
  }
}

class TrackStartEnd {
  recStart: Moment;
  trackStart: Moment;
  trackEnd: Moment;
  constructor(rec: Recording, track: Track) {
    this.recStart = moment(rec.recordingDateTime);
    this.trackStart = moment(rec.recordingDateTime);
    this.trackEnd = moment(rec.recordingDateTime);

    if (track.data) {
      this.trackStart = this.trackStart.add(track.data.start_s * 1000, "ms");
      this.trackEnd = this.trackEnd.add(track.data.end_s * 1000, "ms");
    } else {
      this.trackStart = this.recStart;
      this.trackEnd = this.recStart;
    }
  }
}

export function isWithinVisitInterval(
  firstTime: Moment,
  secondTime: Moment
): boolean {
  const secondsDiff = Math.abs(firstTime.diff(secondTime, "seconds"));
  return secondsDiff <= eventMaxTimeSeconds;
}

export interface DeviceVisitMap {
  [key: number]: DeviceVisits;
}

export default function () {
  console.log("");
}
export {
  DeviceSummary,
  DeviceVisits,
  VisitSummary,
  Visit,
  VisitEvent,
  TrackStartEnd
};
