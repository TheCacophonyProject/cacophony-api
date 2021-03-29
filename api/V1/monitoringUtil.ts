/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2021  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { User } from "../../models/User";
import {QueryTypes} from "sequelize";
import models from "../../models";

const GROUPS_AND_DEVICES = "GROUPS_AND_DEVICES";
const USER_PERMISSIONS = "USER_PERMISSIONS";
const DATE_SELECTION = "DATE_SELECTION";

const LAST_TIMES_TABLE = `with lasttimes as                                    
(select "recordingDateTime", "DeviceId", "GroupId",
   LAG("recordingDateTime", 1) OVER 
    (PARTITION BY "DeviceId" ORDER BY "recordingDateTime")
     lasttime  from "Recordings" 
     where "recordingDateTime" is not NULL 
       and type = 'thermalRaw' 
       and duration > 0
       {${GROUPS_AND_DEVICES}}
       {${USER_PERMISSIONS}}
       {${DATE_SELECTION}}
)`;

const WHERE_IS_VISIT_START = `where "lasttime" is NULL 
or extract(epoch from "recordingDateTime") - extract(epoch from "lasttime") > 600`;

const VISITS_COUNT_SQL = `${LAST_TIMES_TABLE} select count(*) from "lasttimes" ${WHERE_IS_VISIT_START}`;

const VISIT_STARTS_SQL = `${LAST_TIMES_TABLE} 
select * from "lasttimes" 
${WHERE_IS_VISIT_START}
order by "recordingDateTime" desc 
limit 10;`;

export interface MonitoringParams {
    user : User;
    groups? : number[];
    devices? : number[];
    from? : Date;
    until? : Date;
}

async function monitoringData(
    params?: MonitoringParams
)
{
    const replacements = {
        GROUPS_AND_DEVICES : makeGroupsAndDevicesCriteria(params.devices, params.groups),
        USER_PERMISSIONS: await makeGroupsAndDevicesPermissions(params.user),
        DATE_SELECTION: makeDatesCriteria(params)
    }

    const count = await models.sequelize.query(replaceInSQL(VISITS_COUNT_SQL, replacements), { type: QueryTypes.SELECT });
    const results = await models.sequelize.query(replaceInSQL(VISIT_STARTS_SQL, replacements), { type: QueryTypes.SELECT });
    return { count: count[0].count, visitStarts: results};
}

function replaceInSQL(sql: string, replacements: { [key: string]: string} ) : string {
    for (const key in replacements) {
        sql = sql.replace(`{${key}}`, replacements[key]);
    };
    return sql;
}

function makeGroupsAndDevicesCriteria(deviceIds?: number[], groupIds?: number[]): string {
    const devString = deviceIds && deviceIds.length > 0 ? `"DeviceId" IN (${deviceIds.join(",")})` : null;
    const grpString = groupIds && groupIds.length > 0 ? `"GroupId" IN (${groupIds.join(",")})` : null;

    if (devString && grpString) {
        return ` and (${devString} or ${grpString})`;
    }
    else if (devString) {
        return ` and ${devString}`;
    }
    else if (grpString) {
        return ` and ${grpString}`;
    }
    
    return "";
}

function makeDatesCriteria(params : MonitoringParams) : string {
    const fromCondition = (params.from) ? ` AND "recordingDateTime" > '${toPgDate(params.from)}' ` : "";  
    const untilCondition = (params.until) ? ` AND "recordingDateTime" < '${toPgDate(params.until)}' ` : "";
    return fromCondition + untilCondition;
}

function toPgDate(date: Date): string {
    return date.toISOString().replace('T',' ').replace('Z',' +00:00');
}


async function makeGroupsAndDevicesPermissions(user: User): Promise<string> {
    if (user.hasGlobalRead()) {
        return "";
    }

    // FIXME(jon): Should really combine these into a single query?
    const [deviceIds, groupIds] = await Promise.all([
        user.getDeviceIds(),
        user.getGroupsIds()
    ]);
    return makeGroupsAndDevicesCriteria(deviceIds, groupIds);
}


export default {
    monitoringData,
};
  
// Returns a promise for the recordings visits query specified in the
// request.
// async function queryVisits(
//     request: RecordingQuery,
//     type?
//   ): Promise<{
//     visits: Visit[];
//     summary: DeviceSummary;
//     hasMoreVisits: boolean;
//     queryOffset: number;
//     totalRecordings: number;
//     numRecordings: number;
//     numVisits: number;
//   }> {
//     const maxVisitQueryResults = 5000;
//     const requestVisits =
//       request.query.limit == null
//         ? maxVisitQueryResults
//         : (request.query.limit as number);
  
//     let queryMax = maxVisitQueryResults * 2;
//     let queryLimit = queryMax;
//     if (request.query.limit) {
//       queryLimit = Math.min(request.query.limit * 2, queryMax);
//     }
  
//     const builder = await new models.Recording.queryBuilder().init(
//       request.user,
//       request.query.where,
//       request.query.tagMode,
//       request.query.tags,
//       request.query.offset,
//       queryLimit,
//       null
//     );
//     builder.query.distinct = true;
//     builder.addAudioEvents(  
//       '"Recording"."recordingDateTime" - interval \'1 day\'',
//       '"Recording"."recordingDateTime" + interval \'1 day\''
//     );
  
//     const devSummary = new DeviceSummary();
//     const filterOptions = models.Recording.makeFilterOptions(
//       request.user,
//       request.filterOptions
//     );
//     let numRecordings = 0;
//     let remainingVisits = requestVisits;
//     let totalCount, recordings, gotAllRecordings;
  
//     while (gotAllRecordings || remainingVisits > 0) {
//       if (totalCount) {
//         recordings = await models.Recording.findAll(builder.get());
//       } else {
//         const result = await models.Recording.findAndCountAll(builder.get());
//         totalCount = result.count;
//         recordings = result.rows;
//       }
  
//       numRecordings += recordings.length;
//       gotAllRecordings = recordings.length + builder.query.offset >= recordings;
//       if (recordings.length == 0) {
//         break;
//       }
  
//       for (const [i, rec] of recordings.entries()) {
//         rec.filterData(filterOptions);
//       }
//       devSummary.generateVisits(
//         recordings,
//         request.query.offset || 0,
//         gotAllRecordings,
//         request.user.id
//       );
  
//       if (!gotAllRecordings) {
//         devSummary.checkForCompleteVisits();
//       }
  
//       remainingVisits = requestVisits - devSummary.completeVisitsCount();
//       builder.query.limit = Math.min(remainingVisits * 2, queryMax);
//       builder.query.offset += recordings.length;
//     }
  
//     let queryOffset = 0;
//     // mark all as complete
//     if (gotAllRecordings) {
//       devSummary.markCompleted();
//     } else {
//       devSummary.removeIncompleteVisits();
//     }
//     const audioFileIds = devSummary.allAudioFileIds();
  
//     const visits = devSummary.completeVisits();
//     visits.sort(function (a, b) {
//       return b.start > a.start ? 1 : -1;
//     });
//     // get the offset to use for future queries
//     queryOffset = devSummary.earliestIncompleteOffset();
//     if (queryOffset == null && visits.length > 0) {
//       queryOffset = visits[visits.length - 1].queryOffset + 1;
//     }
  
//     // Bulk look up file details of played audio events.
//     const audioFileNames = new Map();
//     for (const f of await models.File.getMultiple(Array.from(audioFileIds))) {
//       audioFileNames[f.id] = f.details.name;
//     }
  
//     // update the references in deviceMap
//     for (const visit of visits) {
//       for (const audioEvent of visit.audioBaitEvents) {
//         audioEvent.dataValues.fileName =
//           audioFileNames[audioEvent.EventDetail.details.fileId];
//       }
//     }
//     return {
//       visits: visits,
//       summary: devSummary,
//       hasMoreVisits: !gotAllRecordings,
//       totalRecordings: totalCount,
//       queryOffset: queryOffset,
//       numRecordings: numRecordings,
//       numVisits: visits.length
//     };
//   }