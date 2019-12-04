/**
 * @apiDefine V1RecordingReprocessResponse
 * @apiSuccess {Number[]} reprocessed - list of recording ids marked for reprocessing
 * @apiSuccess {Number[]} fail - list of recording ids that failed to be marked for reprocessing
 * @apiSuccess {String[]} messages Messages about the request.
 */

/**
 * @apiDefine V1ResponseSuccess
 * @apiSuccess {Boolean} success `true` - Request was successful.
 * @apiSuccess {String[]} messages Messages about the request.
 */

/**
 * @apiDefine V1ResponseError
 * @apiError {Boolean} success `false` - Request failed.
 * @apiError {String[]} messages Messages about the error.
 */

/**
 * @apiDefine V1UserAuthorizationHeader
 * @apiHeader {String} Authorization Signed JSON web token for a user.
 */

/**
 * @apiDefine V1DeviceAuthorizationHeader
 * @apiHeader {String} Authorization Signed JSON web token for a device.
 */

/**
 * @apiDefine BaseQueryParams
 * @apiParam {JSON} [where] Selection criteria as a map of keys and requried value, or a list of possible values.
 * * For example {"device": 1}  or {"name": ["bob", "charles"]}.
 * * All matches must be exact.
 * * Records must match all criteria.
 * * Use a '.' to join keys embeded in other keys.  For example, use {"details.name": "sample"}
 * to match { "details": {"name": "sample"}}.  Note: Only some embeded keys will work.
 * @apiParam {Number} [offset] Zero-based page number. Use '0' to get the first page.  Each page has 'limit' number of records.
 * @apiParam {Number} [limit] Max number of records to be returned.
 * @apiParam {JSON} [order] Sorting order for records.
 * * For example, ["dateTime"] or [["dateTime", "ASC"]].
 */

/**
 * @apiDefine MoreQueryParams
 * @apiParam {JSON} [tags] Only return recordings tagged with one or more of the listed tags (JSON array).
 * @apiParam {String} [tagMode] Only return recordings with specific types of tags. Valid values:
 * <ul>
 * <li>any: match recordings with any (or no) tag
 * <li>untagged: match only recordings with no tags
 * <li>tagged: match only recordings which have been tagged
 * <li>no-human: match only recordings which are untagged or have been automatically tagged
 * <li>automatic-only: match only recordings which have been automatically tagged
 * <li>human-only: match only recordings which have been manually tagged
 * <li>automatic+human: match only recordings which have been both automatically & manually tagged
 * </ul>
 */

/**
 * @apiDefine V1ResponseSuccessQuery
 * @apiSuccess {Boolean} success `true` - Request was successful.
 * @apiSuccess {String[]} messages Messages about the request.
 * @apiSuccess {Number} offset Mirrors request offset parameter.
 * @apiSuccess {Number} limit Mirrors request limit parameter.
 * @apiSuccess {Number} count Total number of records which match the query.
 * @apiSuccess {JSON} rows List of details for records which matched the query.
 */

/**
 * @apiDefine MetaDataAndJWT
 * @apiDescription This call returns metadata in JSON format
 * and a JSON Web Token (JWT) which can be used to retrieve the recorded
 * content. The web token should be used with the
 * [/api/v1/signedUrl API](#api-SignedUrl-GetFile) to retrieve the file.
 */

/**
 * @apiDefine FilterOptions
 * @apiParam {JSON} [filterOptions] options for filtering the recordings data.
 * <ul>
 * <li>latLongPrec: Maximum precision of latitude longitude coordinates in meters. Minimum 100m
 * </ul>
 */
