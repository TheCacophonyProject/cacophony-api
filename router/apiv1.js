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

	app.get(baseUrl+'/audioRecordings/:id', function(req, res) {
		var id = req.params.id;
		if (id) {
			log.info('Request for getting audioRecording ' + id);
			//TODO get audioRecording here
			modelUtil.getModelFromId(new AudioRecording, id)
			.then(function(result) {
				console.log(result);
				var resultJson = {"Result": result};
				res.end(JSON.stringify(resultJson));
			})
			.catch(function(err) {
				var errorJson = {"error": err};
				log.error("Error with getting model." + err);
				res.end(JSON.stringify(errorJson));
			});
		} else {
			log.info('Request for search of audioRecording.');
			//TODO get params from request then search database for matching params.
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
			if (!data.audioFile) {
				log.warn('No field "videoFile" in uploaded data.');
				data.audioFile = {};
			}
			data.audioFile.__file = files.file;
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


}
