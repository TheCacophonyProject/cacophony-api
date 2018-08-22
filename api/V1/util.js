var log = require('../../logging');
var responseUtil = require('./responseUtil');
const uuidv4            = require('uuid/v4');
const multiparty        = require('multiparty');
const config            = require('../../config');
const modelsUtil        = require('../../models/util/util');


function multipartUpload(buildRecord){
  return (request, response) => {
    var key = uuidv4();
    var data;
    var filename;
    var upload;

    // Note regarding multiparty: there are no guarantees about the
    // order that the field and part handlers will be called. You need
    // to formulate the response to the client in the close handler.
    var form = new multiparty.Form();

    // Handle the "data" field.
    form.on('field', (name, value) => {
      if (name != 'data') {
        return;
      }

      try {
        data = JSON.parse(value);
      } catch (err) {
        // This leaves `data` unset so that the close handler (below)
        // will fail the upload.
        log.error("invalid 'data' field:", err);
      }
    });

    // Handle the "file" part.
    form.on('part', (part) => {
      if (part.name != 'file') {
        part.resume();
        return;
      }
      filename = part.filename;

      upload = modelsUtil.openS3().upload({
        Bucket: config.s3.bucket,
        Key: key,
        Body: part,
      }).promise()
        .catch((err) => {
          return err;
        });
      log.debug('started streaming upload to bucket...');
    });

    // Handle any errors. If this is called, the close handler
    // shouldn't be.
    form.on('error', (err) => {
      responseUtil.serverError(response, err);
    });

    // This gets called once all fields and parts have been read.
    form.on('close', async () => {
      if (!data) {
        log.error("upload missing 'data' field");
        responseUtil.invalidDatapointUpload(response);
        return;
      }
      if (!upload) {
        log.error("upload was never started");
        responseUtil.invalidDatapointUpload(response);
        return;
      }

      var dbRecord;
      try {
        // Wait for the upload to complete.
        var uploadResult = await upload;
        if (uploadResult instanceof Error) {
          responseUtil.serverError(response, uploadResult);
          return;
        }
        log.info("finished streaming upload to object store. key:", key);

        data.filename = filename;

        // Store a record for the upload.
        dbRecord = buildRecord(request, data, key);
        await dbRecord.validate();
        await dbRecord.save();
      } catch (err) {
        responseUtil.serverError(response, err);
        return;
      }
      responseUtil.validRecordingUpload(response, dbRecord.id);
    });

    form.parse(request);
  };
}

exports.multipartUpload = multipartUpload;
