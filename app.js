const restify = require('restify');
const request = require('request');
const { bodyParser } = require('restify-plugins');
require('dotenv').config();
const fs = require('fs');
const botRegEx = require('./bot/main.js');
const botLUIS = require('./bot/main.luis.js');
const bot = process.env.LUIS_MODEL_URL ? botLUIS : botRegEx;
console.log(`PORT is::${process.env.PORT}`);
const server = restify.createServer();
const serverMock = require('./serverMock/regions');
const mailer = require('./serverMock/mailer');
const dbUtil = require('./serverMock/dbUtil');
const mongoDBConnectionString = process.env.MONGODB_URI || "mongodb://chatbot:chatbot@ds111496.mlab.com:11496/chatbot";
let dbUp = false;
console.log(`DB status is ON=> ${dbUp}`);
if (mongoDBConnectionString) {
    dbUtil.connect(mongoDBConnectionString, (err) => {
        console.log(err);
        dbUp = err ? false : true;
        console.log(`DB status is ON=> ${dbUp}`);
    })
}
const saveInDb = (data) => {
    const db = dbUtil.get();
    if (db) {
        dbUtil.saveData("bots", data);
    }
}
const cleardb = (collection) => {
    const db = dbUtil.get();
    if (db) {
        dbUtil.clearCol(collection);
    }
}
const saveUserHistoryInDb = (data) => {
    const db = dbUtil.get();
    if (db) {
        dbUtil.saveData("userHistory", data);
    }
}
const getUserHistory = (userid) => {
    const db = dbUtil.get();
    const conservsation = [];
    if (db) {
        var promise = dbUtil.getUserData("userHistory", userid).toArray();
        return promise.then(function (items) {
            if (items.length) {
                items.forEach(userhistory => {
                    console.log(`${userhistory.username} : ${userhistory.message}`);
                    conservsation.push(`${userhistory.username}: ${userhistory.message}`);
                });
                return conservsation.join("<br />");
            }else{
                return [];
            }
        })
    }
    return conservsation.join("\n");
}

server.use(bodyParser());

server.post('/api/messages', bot.connector('*').listen());
server.get(/\/js\/?.*/, restify.plugins.serveStatic({
    directory: `${__dirname}/web-client/public`
}));
server.get(/\/css\/?.*/, restify.plugins.serveStatic({
    directory: './web-client/public',
}));
server.get('/cleardb', function (req, res, next) {
    cleardb("bots");
    res.send(200);
    next();
});
server.post('/api/sendmail', function (req, res, next) {
    const data = req.body;
    const mailbody = ` Username: ${data.username}\n\n
        StartTime: ${data.starttime}\n\n
        EndTime: ${data.endtime}\n\n
        PhoneNo: ${data.phoneno}\n\n
        EmailId: ${data.email}\n\n
        Location: ${data.location}\n\n`;
    const mailbodyHtml = ` Username: ${data.username}<br/>
        StartTime: ${data.starttime}<br/>
        EndTime: ${data.endtime}<br/>
        PhoneNo: ${data.phoneno}<br/>
        EmailId: ${data.email}<br/>
        Location: ${data.location}<br/><br/>`;
    const userMailBody = `Hi ${data.username || "Guest"} Thanks for visiting Armstrong
    <br/>
    <br/>
    Our support team will get back to you soon
    <br />
    Chat Transcript ::
    <br />
    `
    let mailOptions = {
        from: `"Admin Support " <${process.env.SMTP_EMAIL}>`, // sender address
        to: `${process.env.SUPPORT_EMAILID}`, // list of receivers
        subject: 'Armstrong: Visitor Information', // Subject line
        text: mailbody, // plain text body
        html: mailbodyHtml // html body
    };
    let mailOptions_guest = {
        from: `"Armstrong " <${process.env.SMTP_EMAIL}>`, // sender address
        to: `${data.email}`, // list of receivers
        subject: 'Armstrong: Greeting Email ', // Subject line
        html: userMailBody // html body
    };
    const _data = getUserHistory(data.userid);
    _data.then(function (conv) {
        mailOptions_guest.html =  `${mailOptions_guest.html} ${conv}
        <br />
        <br />
        Regards
        <br />
        Armstrong Support
        <br />`;
        mailer.sendMail(mailOptions_guest);
        mailer.sendMail(mailOptions);
        res.send(200);
        saveInDb(data);
        next();
    })
});
server.post('/api/userhistory', function (req, res, next) {
    if (dbUp) {
        saveUserHistoryInDb(req.body);
        res.send(200);
        next();
    } else {
        next(new Error('N db'));
    }
});
server.get('/api/userhistory/:userid', function (req, res, next) {
    const userid = req.params.userid;
    if (dbUp) {
        const data = getUserHistory(userid);
        data.then(function (conv) {
            res.send(conv);
            next();
        });
    } else {
        res.send(200);
        next(new Error('N db'));
    }
});
server.get('/api/region/:latitude/:longitude', function (req, res, next) {
    const { latitude, longitude } = req.params;
    var region = serverMock.getNearset({
        latitude: Number(latitude), longitude: Number(longitude)
    });
    serverMock.getRegionSVC(region.id).then((allRep) => {
        res.contentType = 'json';
        res.send(200, { region: region, svc: allRep });
        next();
    }).catch(() => {
        next(new Error());
    })
});
server.get('/api/regionloc/:text', function (req, res, next) {
    const { text } = req.params;
    var subRegions = serverMock.getSubRegions(text.toLowerCase().replace(/ /g, ''));
    if (subRegions.length > 1) {
        res.contentType = 'json';
        res.send(200, { hasSubRegion: true, svc: subRegions });
        next();
    } else {
        var region = serverMock.getNearsetByText(text.toLowerCase().replace(/ /g, ''));
        if (region) {
            serverMock.getRegionSVC(region.id).then((allRep) => {
                res.contentType = 'json';
                res.send(200, { region: region, svc: allRep });
                next();
            }).catch(() => {
                next(new Error());
            })
        } else {
            // No region show all regions
            var subRegions = serverMock.getAllRegionsMock();
            res.contentType = 'json';
            res.send(200, { defaultList: true, svc: subRegions });
            next();
        }
    }
});

server.get('/api/location/:latitude/:longitude', function (req, res, next) {
    var key = process.env.GOOGLE_API_KEY;
    var cord = `${req.params.latitude},${req.params.longitude}`;
    var url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${cord}&key=${key}`;
    request.get({ url: url, json: true }, function (e, r, data) {
        if (e) {
            next(e);
            return;
        }
        res.contentType = 'json';
        if (data && data.status == "OK") {
            var results = data.results.filter(d => d.types.includes("administrative_area_level_1"));
            if (results.length) {
                var locatlity = results[0];
                res.send(200, { location: locatlity.formatted_address });
                next();
                return;
            }
        }
        res.send(200, { location: "" });
        next();
    })
});
server.get(/\/image\/?.*/, restify.plugins.serveStatic({
    directory: './web-client/public',
}));
server.get('/', function indexHTML(req, res, next) {
    fs.readFile(__dirname + '/web-client/index.html', function (err, data) {
        if (err) {
            next(err);
            return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(data);
        next();
    });
});
server.get('/admin', function indexHTML(req, res, next) {
    fs.readFile(__dirname + '/web-client/dashboard.html', function (err, data) {
        if (err) {
            next(err);
            return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(data);
        next();
    });
});
server.get('/api/history', function (req, res, next) {
    if (dbUp) {
        dbUtil.get().collection('bots').find().toArray(function (err, doc) {
            if (err) {
                next(err);
                return;
            } else {
                doc = doc || [];
                res.contentType = 'json';
                res.send(200, doc);
                next();
            }
        })
    } else {
        next(new Error('N db'));
        return;
    }
});
server.listen(process.env.PORT, () => {
    console.log(`${server.name} listening to ${server.url}`);
});