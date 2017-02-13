function findAllWithUser(model, user, queryParams) {
  return new Promise(function(resolve, reject) {
    var models = require('./');
    if (typeof queryParams.limit == 'undefined') queryParams.limit = 20;
    if (typeof queryParams.offset == 'undefined') queryParams.offset = 0;

    // Find what devices the user can see.
    if (!user) {
      // Not logged in, can onnly see public recordings.
      model.findAll({
        where: { "$and": [queryParams.where, { public: true }] },
        include: [models.Group],
        limit: queryParams.limit,
        offset: queryParams.offset
      }).then((result) => resolve(result));
    } else {
      models.User.findOne({ where: user.id }) //TODO find a better way do deal with the require.
        .then((user) => user.getGroupsIds())
        .then(function(ids) {
          // Adding filter so they only see recordings that they are allowed to.
          queryParams.where = {
            "$and": [
              queryParams.where,
              { "$or": [{ public: true }, { GroupId: { "$in": ids } }] }
            ]
          };
          queryParams.include = [models.Group];
          queryParams.limit = queryParams.limit;
          queryParams.offset = queryParams.offset;
          return model.findAndCount(queryParams);
        }).then(function(result) {
          result.limit = queryParams.limit;
          result.offset = queryParams.offset;
          resolve(result);
        });
    }
  });
}

exports.findAllWithUser = findAllWithUser;
