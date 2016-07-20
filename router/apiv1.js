var orm = require('../models/orm');
var log = require('../logging');
var formidable = require('formidable');
var modelUtil = require('../models/util');
var AudioRecording = require('../models/audioRecording');
var VideoRecording = require('../models/videoRecording');

var baseUrl = '/api/v1';

module.exports = function(app) {

	/**
	 * @api {post} /api/v1/audioRecordings Add AudioRecording
	 * @apiName PostAudioRecording
	 * @apiGroup AudioRecording
	 * @apiVersion 1.0.0
	 *
	 * @apiParam {JSON} data			 Metadata for the AudioRecording.
	 * @apiParam {File} recording  The audio file.
	 *
	 * @apiParamExample {json} Data-Example:
	 *		{
	 *			"audioFile": { "startTimestamp": "2016-01-1 12:30:20.123+1300", "duration": 120},
	 *			"device": { "id": 123, "type": "cacophonometer1.0"},
	 *			"recordingRule": { "id": 123, "name": "RuleName", "duration": 120},
	 *			"location": { "id": 123, "latitude": 123123123, "longitude": 321321321, "timestamp": "2016-01-1 12:30:20.123+1300", "accuracy": 40},
	 *			"hardware": { "id": 123, "manufacturer": "CacoMan", "model": "M-Two", "solarPanelPower": 6000},
	 *			"software": { "id": 123, "version": 0.1.2},
	 *			"microphone": { "id": 123, "type": "electret" },
	 *			"environment": { "id": 123, "tempreature": 21},
	 *			"batteryPercentage": 48,
	 *			"tags": {},
	 *			"extra": {}
 	 *		}
	 * @apiSuccessExample {json} Success-Response:
	 *     HTTP 200
	 *    {
	 *      "Message": "Successful AudioRecording Post."
	 *    }
	 *
	 * @apiErrorExample {json} Error-Response:
	 *    HTTP 200
	 *    {
	 *      "error": [Error message]
	 *    }
	 */

	app.post(baseUrl+'/audioRecordings', function(req, res) {
		var audioRecording;
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			var data = JSON.parse(fields.data);
			if (!data.audioFile) {
				log.warn('No field "audioFile" in uploaded data.');
				data.audioFile = {};
			}
			data.audioFile.__file = files.file;
			var ar = new AudioRecording(data);
			modelUtil.syncModel(ar)
		  .then(function(result) {
				var response = { "Message" : "Successful AudioRecording Post." };
        res.end(JSON.stringify(response));
		    log.info('Finished AudioRecording sync.');
		  })
		  .catch(function(err) {
		    log.error('Error with syncing audioRecording: ', err);
				var errorResponse = { "error" : err.message};
        res.end(JSON.stringify(errorResponse));
		  });
		});
	});

	app.put(baseUrl+'/audioRecordingsTags/:id', function(request, response) {
		var types = ['replace'];	// more types will be added, (add, delete, deleteAll)
		var tags = request.query.tags;
		var type = 'replace';	// default value.
		if (request.query.type)
			type = request.query.type;
		var id = request.params.id;
		log.debug('AudioRecording put request for ', id);
		try {
			tags = JSON.parse(tags);
		} catch (err) {
			log.debug('Error with parsing tags', tags);
			response.status(400);
			response.end('Error with parsing tags: ' + tags);
		}
		modelUtil.updateTags(new AudioRecording, id, tags, type)
		.then(function(result) {
			log.debug('Updated AudioRecording tags');
			response.end('Updated tags');
		})
		.catch(function(err) {
			log.debug('Error with updating tags', err);
			response.status(500);
			response.end('Error with updating tags: '+ err);
		});
	});

	/**
	 * @api {get} /api/v1/audioRecordings/:id Get AudioRecording
	 * @apiName GetAudioRecording
	 * @apiGroup AudioRecording
	 * @apiVersion 1.0.0
	 *
	 * @apiParam {String} id			 ID of the AudioRecording.
	 *
	 * @apiSuccessExample {json} Success-Response:
	 *     HTTP 200
	 *    {
	 *			"audioRecording"
	 *			  {
	 *					//AudioRecording metadata.
 	 *				}
	 *    }
	 *
	 * @apiErrorExample {json} Error-Response:
	 *    HTTP 200
	 *    {
	 *      "error": [Error message]
	 *    }
	 */

	app.get(baseUrl+'/audioRecordings/:id', function(req, res) {
		var id = req.params.id;

		log.info('Request for getting audioRecording ' + id);
		modelUtil.getModelFromId(new AudioRecording, id)
		.then(function(result) {
			res.end(JSON.stringify(result));
		})
		.catch(function(err) {
			var errorJson = {"error": err};
			log.error("Error with getting model." + err);
			res.end(JSON.stringify(errorJson));
		});
	});


	app.get(baseUrl+'/audioRecordings', function(req, res) {
		var query = req.query.q;
		log.info("Getting Audio recording query:", query);
		try {
			query = JSON.parse(query);
			ar = new AudioRecording();
			ar.query(query, 1)
			.then(function(result) {
				log.info("Number of results:", result.length)
				res.end(JSON.stringify(result));
			})
			.catch(function(err) {
				log.error("Error in AudioRecording query.", err);
				res.status(500);
				res.end("Error with query", err)
			})
		} catch (err) {
			log.warn("Error with user query.", err);
			res.status(400);
			res.end("Error with query.", err);
		}
	});

	/**
	 * @api {post} /api/v1/videoRecordings Add VideoRecording
	 * @apiName PostVideoRecording
	 * @apiGroup VideoRecording
	 * @apiVersion 1.0.0
	 *
	 * @apiParam {JSON} data			 Metadata for the VideoRecording.
	 * @apiParam {File} recording  The audio file.
	 */

	app.post(baseUrl+'/videoRecordings', function(req, res) {
		var audioRecording;
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			var data = JSON.parse(fields.data);
			if (!data.videoFile) {
				log.warn('No field "videoFile" in uploaded data.');
				data.videoFile = {};
			}
			data.videoFile.__file = files.file;
			var ar = new VideoRecording(data);
			modelUtil.syncModel(ar)
			.then(function(result) {
				res.end('success');
				log.info('Finished VideoRecording sync.');
			})
			.catch(function(err) {
				log.error('Error with syncing videoRecoring: ', err);
				res.end('error:' + err.message );
			});
		});
	});

	app.put(baseUrl+'/videoRecordingsTags/:id', function(request, response) {
		var types = ['replace'];	// more types will be added, (add, delete, deleteAll)
		var tags = request.query.tags;
		var type = 'replace';	// default value.
		if (request.query.type)
			type = request.query.type;
		var id = request.params.id;
		log.debug('VideoRecording put request for ', id);
		try {
			tags = JSON.parse(tags);
		} catch (err) {
			log.debug('Error with parsing tags', tags);
			response.status(400);
			response.end('Error with parsing tags: ' + tags);
		}
		modelUtil.updateTags(new VideoRecording, id, tags, type)
		.then(function(result) {
			log.debug('Updated AudioRecording tags');
			response.end('Updated tags');
		})
		.catch(function(err) {
			log.debug('Error with updating tags', err);
			response.status(500);
			response.end('Error with updating tags: '+ err);
		});
	});


	app.get(baseUrl+'/videoRecordings', function(req, res) {
		var query = req.query.q;
		log.info("Getting Video recording query:", query);
		try {
			query = JSON.parse(query);
			vr = new VideoRecording();
			vr.query(query, 1)
			.then(function(result) {
				log.info("Number of results:", result.length)
				res.end(JSON.stringify(result));
			})
			.catch(function(err) {
				log.error("Error in VideoRecording query.", err);
				res.status(500);
				res.end("Error with query", err)
			})
		} catch (err) {
			log.warn("Error with user query.", err);
			res.status(400);
			res.end("Error with query.", err);
		}
	});

	/**
	 *
	 */
	app.get(baseUrl+'/getFile', function(req, res) {
		var fileDir = req.query.file;
		modelUtil.getFileSignedUrl(fileDir)
		.then(function(fileUrl) {
			res.end("<a href="+fileUrl+">"+fileUrl+"</a>");
		})
		.catch(function(err) {
			log.error("Error with getting file", err);
			res.status(500);
			res.end("Error with query", err)
		});
	});

}
