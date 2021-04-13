import moment, { Moment } from "moment";
import { MonitoringPageCriteria, MonitoringParams } from "./monitoringPage";
import models from "../../models";
import { Recording } from "../../models/Recording";
import { getTrackTag, unidentifiedTags } from "./Visits";
import { User } from "../../models/User";

const MINUTE = 60;
const MAX_SECS_BETWEEN_RECORDINGS = 10 * MINUTE;
const MAX_SECS_VIDEO_LENGTH = 10 * MINUTE;
const LIMIT_RECORDINGS = 2000;
const MAX_MINS_AFTER_TIME = 70;

type TagName = string;
type Count = number; 


class Visit {
    
    rawRecordings: Recording[];
    recordings: VisitRecording[];
    what?: string;
    isUserTagged: boolean;
    aiWhat? : string;
    end?: Moment;
    start?: Moment; 
    device: any;
    incomplete: boolean;
    
    constructor(device, recording:Recording) {
        this.device = device;
        this.recordings = [];
        this.rawRecordings = [];
        this.incomplete = false;

        this.rawRecordings.push(recording);
        this.start = moment(recording.recordingDateTime);
        this.end = moment(this.start).add(recording.duration, "seconds");
    }

    // note this function assumes that the recording starts after the recordings alreayd in the visit.  
    isRecordingInVisit(recording : Recording) {
        if (!this.end) {
            return true;
        }

        const cutoff = moment(this.end).add(MAX_SECS_BETWEEN_RECORDINGS, "seconds");
        
        return cutoff.isAfter(recording.recordingDateTime);
    }


    addRecordingIfWithinTimeLimits(recording: Recording) : boolean {
        if (!this.isRecordingInVisit(recording)) {
            return false;
        }

        this.rawRecordings.push(recording);
        this.end = moment(recording.recordingDateTime).add(recording.duration, "seconds");
        
        return true;
    }

    calculateTags(aiModel: string) {
        this.rawRecordings.forEach(rec => { this.recordings.push(this.calculateTrackTags(rec, aiModel)) });
        this.rawRecordings = [];

        const allVisitTracks = this.getAllTracks();
        const bestHumanTags = getBestGuessOverall(allVisitTracks, HUMAN_ONLY);

        if (bestHumanTags.length > 0) {
            this.what = bestHumanTags[0];
            this.isUserTagged = true;
        } else {
            const bestAiTags = getBestGuessOverall(allVisitTracks, AI_ONLY);
            this.what = bestAiTags.length > 0 ? bestAiTags[0] : "none";
            this.isUserTagged = false;
        }

        const aiGuess = getBestGuessFromSpecifiedAi(allVisitTracks);
        this.aiWhat = aiGuess.length > 0 ? aiGuess[0] : "none";
    }

    calculateTrackTags(recording, aiModel: string) : VisitRecording {
        const newVisitRecording : VisitRecording = {
            recId : recording.id,
            start : recording.recordingDateTime,
            tracks : [],
        } 
        for (const track of (recording as any).Tracks) {
            const bestTag = getTrackTag(track.TrackTags, 0);
            let aiTag = [];
            if (track.TrackTags) {
                aiTag =  track.TrackTags.filter((tag) => tag.data == aiModel);          
            }

            newVisitRecording.tracks.push({
                tag: bestTag ? bestTag.what : null,
                isAITagged: bestTag ? bestTag.automatic : false,
                aiTag: aiTag.length > 0 ? aiTag[0].what : null,
                start: (track.data) ? track.data.start_s : "",
                end: (track.data) ? track.data.end_s : "",
                orig: null
            });
        }
        return newVisitRecording;
    }

    getAllTracks () : VisitTrack[] {
        const allVisitTracks : VisitTrack[] = [];
        this.recordings.forEach(recording => {
            allVisitTracks.push(...recording.tracks);
        });
        return allVisitTracks;
    }

    markIfPossiblyIncomplete(cutoff: Moment) {
        this.incomplete = (!this.end || this.end.isAfter(cutoff));
    }
};

const TAG = 0;
const COUNT = 1;

const HUMAN_ONLY = false;
const AI_ONLY = true;


function countTags(allTracks : VisitTrack[], isAi : boolean) : [TagName, Count][] {
    const tracks = allTracks.filter((track) => track.isAITagged == isAi);
    
    const counts  = {};
    tracks.forEach(track => {
        const tag = track.tag;
        if (tag) {
            counts[tag] = counts[tag] ? (counts[tag] += 1) : 1;
        }
    });

    return Object.entries(counts);
}

function getBestGuessFromSpecifiedAi(tracks : VisitTrack[]) : string[] {
    const counts  = {};
    tracks.forEach(track => {
        const tag = track.aiTag;
        if (tag) {
            counts[tag] = counts[tag] ? (counts[tag] += 1) : 1;
        }        
    });
    
    return getBestGuess(Object.entries(counts));
}


function getBestGuessOverall(allTracks : VisitTrack[], isAi : boolean) : string[] {
    const counts = countTags(allTracks, isAi);
    return getBestGuess(counts);
}


function getBestGuess(counts : [TagName, Count][]) : string[] {

    const animalCounts = counts.filter((tc) => { return !unidentifiedTags.includes(tc[TAG]); });

    const tagCounts = (animalCounts.length > 0) ? animalCounts : counts;

    const maxCount = Math.max(...tagCounts.map((tc) => tc[COUNT]));
    const tagsWithMaxCount = tagCounts.filter((tc) => tc[COUNT] === maxCount).map((tc) => tc[TAG]);

    return tagsWithMaxCount;
}

interface VisitRecording {
    recId: number;
    start: string;
    tracks: VisitTrack[];
}

interface VisitTrack {
    // this is the overriding tag that we have given this event
    // e.g. if it was unidentified but grouped under a cat visit
    // assumedTag woudl be "cat"
    tag: string;
    aiTag: string;
    isAITagged: boolean;
    start: string;
    end: string;
    orig: any;
}

export async function generateVisits(user: User, search: MonitoringPageCriteria) {
    const search_start = moment(search.pageFrom).subtract(MAX_SECS_BETWEEN_RECORDINGS + MAX_SECS_VIDEO_LENGTH, "seconds");
    const search_end = moment(search.pageTo).add(MAX_MINS_AFTER_TIME, "minutes");

    const recordings = await getRecordings(user, search, search_start, search_end);
    // what if count is too above limit? LIMIT_RECORDING

    const visits = groupRecordingsIntoVisits(recordings, moment(search.pageFrom), moment(search.pageTo));

    const incompleteCutoff = moment(search_end).subtract(MAX_SECS_BETWEEN_RECORDINGS, "seconds");
    
    visits.forEach(visit => {
        visit.calculateTags("Master");
        visit.markIfPossiblyIncomplete(incompleteCutoff);
    });

    return visits;
};

async function getRecordings(user: User, params: MonitoringPageCriteria, from : Moment, until : Moment) {
    const where : any = {
        duration: {"$gte":"0"},
        type:"thermalRaw",
        recordingDateTime: {"$gte": from, "$lt" : until}
    }
    if (params.devices) {
        where.DeviceId = params.devices;
    }
    if (params.groups) {
        where.GroupId = params.groups;
    }
    const order = [["recordingDateTime", "ASC"]];

    const builder = await new models.Recording.queryBuilder().init(
        user,
        where,
        null,
        null,
        null,
        LIMIT_RECORDINGS,
        order,
        true // superAdmin fix later
    );

    return models.Recording.findAll(builder.get());
}

function groupRecordingsIntoVisits(recordings: Recording[], start: Moment, end: Moment) : Visit[] {
    const currentVisitForDevice : { [key: number]: Visit; } = {};
    const allVisits : Visit[] = [];
    
    recordings.forEach(rec => {
        const currentVisit : Visit = currentVisitForDevice[rec.DeviceId];
        if (!currentVisit || !currentVisit.addRecordingIfWithinTimeLimits(rec)) {
            if (end.isSameOrAfter(rec.recordingDateTime)) {
                const newVisit = new Visit((rec as any).device, rec);
                // we want to keep adding recordings to this visit even it started too early
                // before the official time period
                currentVisitForDevice[rec.DeviceId] = newVisit;            
                
                if (start.isBefore(rec.recordingDateTime)) {
                    // only want to return visits that start between the start and end times.
                    allVisits.push(newVisit);
                } 
            }
            else {
                // visit actually starts after the time period so we don't want to know.  
                currentVisitForDevice[rec.DeviceId] = null;            
            }
        }
    });

    return allVisits;
}
