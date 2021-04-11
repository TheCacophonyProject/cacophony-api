import moment, { Moment } from "moment";
import { SearchCriteria, MonitoringParams } from "./monitoringUtil";
import models from "../../models";
import { Recording } from "../../models/Recording";
import { getTrackTag, unidentifiedTags } from "./Visits";

const MINUTE = 60;
const MAX_SECS_BETWEEN_RECORDINGS = 10 * MINUTE;
const LIMIT_RECORDINGS = 2000;

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
    
    constructor(device: any) {
        this.device = device;
        this.recordings = [];
        this.rawRecordings = [];
    }

    isEarlierRecordingInSameVisit(recording : Recording) {
        // this could be make a lot specific by taking into account the length of the recording/tracks.
        if (!this.start) {
            return true;
        }
        
        return Math.abs(moment(recording.recordingDateTime).diff(this.start, "seconds")) < MAX_SECS_BETWEEN_RECORDINGS;
    }

    addRecording(recording: Recording) : boolean {
        if (!this.isEarlierRecordingInSameVisit(recording)) {
            return false;
        }
        this.rawRecordings.push(recording);
        let startTime = moment(recording.recordingDateTime);

        if (!this.start || this.start.isAfter(startTime)) {
            this.start = moment(startTime)
        }
        
        // update times
        if (!this.end) {
            this.end = moment(startTime).add(recording.duration, "seconds");
        }
        
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

export async function generateVisits(params: MonitoringParams, search: SearchCriteria) {
    const recordings = await getRecordings(params, search);
    // what if count is too above limit? LIMIT_RECORDING

    const allVisits = groupRecordingsIntoVisits(recordings);

    // allVisits.filter(visits that start too early);
    
    allVisits.forEach(visit => {
        visit.calculateTags("Master");
        // visit.markIfUnfinished();
    });

    // recordingsSimp = recordings.map((rec) => { return {time: rec.recordingDateTime, device: rec.DeviceId}});

    return allVisits;
};

async function getRecordings(params: MonitoringParams, search: SearchCriteria) {
    const where : any = {
        duration: {"$gte":"0"},
        type:"thermalRaw",
        // should be $lte for initial search?
        recordingDateTime: {"$gte":  search.from, "$lt" : search.until}
    }
    if (params.devices) {
        where.DeviceId = params.devices;
    }
    if (params.groups) {
        where.GroupId = params.groups;
    }

    // order = [
    //     // Sort by recordingDatetime but handle the case of the
    //     // timestamp being missing and fallback to sorting by id.
    //     [
    //       Sequelize.fn(
    //         "COALESCE",
    //         Sequelize.col("recordingDateTime"),
    //         "1970-01-01"
    //       ),
    //       "DESC"
    //     ],
    //     ["id", "DESC"]
    //   ];
    const builder = await new models.Recording.queryBuilder().init(
        params.user,
        where,
        null,
        null,
        null,
        LIMIT_RECORDINGS,
        null,
        true // superAdmin fix later
    );

    return models.Recording.findAll(builder.get());
}

// generates visits from a list of recordings in ascending date time order
export function groupRecordingsIntoVisits(recordings: Recording[]) : Visit[] {
    const currentVisitForDevice : { [key: number]: Visit; } = {};
    const allVisits : Visit[] = [];
    
    recordings.forEach(rec => {
        const currentVisit : Visit = currentVisitForDevice[rec.DeviceId];
        if (!currentVisit || !currentVisit.addRecording(rec)) {
            const newVisit = new Visit((rec as any).device);
            allVisits.push(newVisit);
            newVisit.addRecording(rec);
            currentVisitForDevice[rec.DeviceId] = newVisit;            
        }
    });

    return allVisits;
}

