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
import { QueryTypes } from "sequelize";
import models from "../../models";

const GROUPS_AND_DEVICES = "GROUPS_AND_DEVICES";
const USER_PERMISSIONS = "USER_PERMISSIONS";
const DATE_SELECTION = "DATE_SELECTION";
const PAGING = "PAGING";
const BEFORE_CACOPHONY = new Date(2017, 1, 1);

const LAST_TIMES_TABLE = `with lasttimes as                                    
(select "recordingDateTime", "DeviceId", "GroupId",
   LAG("recordingDateTime", 1) OVER (PARTITION BY "DeviceId" ORDER BY "recordingDateTime") lasttime,
   LAG("duration", 1) OVER (PARTITION BY "DeviceId" ORDER BY "recordingDateTime") lastduration
     from "Recordings" 
     where "recordingDateTime" is not NULL 
       and type = 'thermalRaw' 
       and duration > 0
       {${GROUPS_AND_DEVICES}}
       {${USER_PERMISSIONS}}
       {${DATE_SELECTION}}
)`;

const WHERE_IS_VISIT_START = `where "lasttime" is NULL 
or extract(epoch from "recordingDateTime") - extract(epoch from "lasttime") - "lastduration" > 600`;

const VISITS_COUNT_SQL = `${LAST_TIMES_TABLE} select count(*) from "lasttimes" ${WHERE_IS_VISIT_START}`;

const VISIT_STARTS_SQL = `${LAST_TIMES_TABLE} 
select * from "lasttimes" 
${WHERE_IS_VISIT_START}
order by "recordingDateTime" desc
{${PAGING}}`;

export interface MonitoringParams {
  user: User;
  groups?: number[];
  devices?: number[];
  from?: Date;
  until?: Date;
  page: number;
  pageSize: number;
}

export interface MonitoringPageCriteria {
  compareAi: string;
  devices?: number[];
  groups?: number[];
  page: number;
  pagesEstimate: number;
  pageFrom?: Date;
  pageUntil?: Date;
  searchFrom?: Date;
  searchUntil?: Date;
}

export async function calculateMonitoringPageCriteria(
  params: MonitoringParams,
  viewAsSuperAdmin: boolean
): Promise<MonitoringPageCriteria> {
  return getDatesForSearch(params, viewAsSuperAdmin);
}

async function getDatesForSearch(
  params: MonitoringParams,
  viewAsSuperAdmin: boolean
): Promise<MonitoringPageCriteria> {
  const replacements = {
    GROUPS_AND_DEVICES: makeGroupsAndDevicesCriteria(
      params.devices,
      params.groups
    ),
    USER_PERMISSIONS: await makeGroupsAndDevicesPermissions(
      params.user,
      viewAsSuperAdmin
    ),
    DATE_SELECTION: makeDatesCriteria(params),
    PAGING: null
  };

  const countRet = await models.sequelize.query(
    replaceInSQL(VISITS_COUNT_SQL, replacements),
    { type: QueryTypes.SELECT }
  );
  const approxVisitCount = parseInt(countRet[0].count);
  const returnVal = createPageCriteria(params, approxVisitCount);

  if (approxVisitCount < params.pageSize) {
    returnVal.pageFrom = returnVal.searchFrom;
    returnVal.pageUntil = returnVal.searchUntil;
  } else if (params.page <= returnVal.pagesEstimate) {
    const limit: number = Number(params.pageSize) + 1;
    const offset: number = (params.page - 1) * params.pageSize;
    replacements.PAGING = ` LIMIT ${limit} OFFSET ${offset}`;
    const results = await models.sequelize.query(
      replaceInSQL(VISIT_STARTS_SQL, replacements),
      { type: QueryTypes.SELECT }
    );

    if (results.length > 0) {
      returnVal.pageUntil =
        params.page == 1 ? returnVal.searchUntil : results[0].recordingDateTime;
      if (params.page < returnVal.pagesEstimate) {
        returnVal.pageFrom = results[results.length - 1].recordingDateTime;
      } else {
        returnVal.pageFrom = returnVal.searchFrom;
      }
    }
  }

  return returnVal;
}

function createPageCriteria(
  params: MonitoringParams,
  count: number
): MonitoringPageCriteria {
  const criteria: MonitoringPageCriteria = {
    page: params.page,
    pagesEstimate: Math.ceil(count / params.pageSize),
    searchFrom: params.from || BEFORE_CACOPHONY,
    searchUntil: params.until || new Date(),
    compareAi: "Master"
  };

  if (params.devices) {
    criteria.devices = params.devices;
  }

  if (params.groups) {
    criteria.groups = params.groups;
  }

  return criteria;
}

function replaceInSQL(
  sql: string,
  replacements: { [key: string]: string }
): string {
  for (const key in replacements) {
    const regexp = new RegExp(`\{${key}\}`, "g");
    sql = sql.replace(`{${key}}`, replacements[key]);
  }
  return sql;
}

function makeGroupsAndDevicesCriteria(
  deviceIds?: number[],
  groupIds?: number[]
): string {
  const devString =
    deviceIds && deviceIds.length > 0
      ? `"DeviceId" IN (${deviceIds.join(",")})`
      : null;
  const grpString =
    groupIds && groupIds.length > 0
      ? `"GroupId" IN (${groupIds.join(",")})`
      : null;

  if (devString && grpString) {
    return ` and (${devString} or ${grpString})`;
  } else if (devString) {
    return ` and ${devString}`;
  } else if (grpString) {
    return ` and ${grpString}`;
  }

  return "";
}

function makeDatesCriteria(params: MonitoringParams): string {
  const fromCondition = params.from
    ? ` AND "recordingDateTime" > '${toPgDate(params.from)}' `
    : "";
  const untilCondition = params.until
    ? ` AND "recordingDateTime" < '${toPgDate(params.until)}' `
    : "";
  return fromCondition + untilCondition;
}

function toPgDate(date: Date): string {
  return date.toISOString().replace("T", " ").replace("Z", " +00:00");
}

async function makeGroupsAndDevicesPermissions(
  user: User,
  viewAsSuperAdmin: boolean
): Promise<string> {
  if (user.hasGlobalRead() && viewAsSuperAdmin) {
    return "";
  }

  const [deviceIds, groupIds] = await Promise.all([
    user.getDeviceIds(),
    user.getGroupsIds()
  ]);
  return makeGroupsAndDevicesCriteria(deviceIds, groupIds);
}
