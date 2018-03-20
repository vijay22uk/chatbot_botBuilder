
var MongoClient = require('mongodb').MongoClient

var state = {
    db: null,
}
exports.connect = function (url, done) {
    if (state.db) return done()

    MongoClient.connect(url, function (err, db) {
        if (err) return done(err)
        state.db = db.db('chatbot')
        done()
    })
}

exports.get = function () {
    return state.db
}

exports.saveData = function (collection, insertData) {
    state.db.collection(collection).insert(insertData);
}
exports.clearCol = function (collection) {
    state.db.collection(collection).remove();
}
exports.getUserData = function (collection, userid) {
    console.log(`fetching user history of  [${userid}] from [${collection}]...`)
    return state.db.collection(collection).find({ userid }).sort({timestamp: 1});
}