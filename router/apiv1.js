var orm = require('../models/orm');
var log = require('../logging');
var formidable = require('formidable');
var modelUtil = require('../models/util');
var AudioRecording = require('../models/audioRecording');

var baseUrl = '/api/v1';

module.exports = function(app) {

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
        res.end('success');
		    log.info('Finished AudioRecording sync.');
		  })
		  .catch(function(err) {
		    log.error('Error with syncing audioRecoring: ', err);
        res.end('error:' + err.message );
		  });
		});
	});
}
