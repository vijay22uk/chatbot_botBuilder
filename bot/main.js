"use strict";

const builder = require("botbuilder");
const dialogs = require("./dialogs");
var request = require('request');

var parseString = require('xml2js').parseString;
var urlencode = require('urlencode');

var tokenHandler = require('./helpers/tokenHandler');
var pumpHelper = require('./helpers/pumps');
const data = require('./data');

var inMemoryStorage = new builder.MemoryBotStorage();
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
})
const bot = new builder.UniversalBot(
    connector, dialogs.sayHello

).set('storage', inMemoryStorage); // Register in memory storage

//=========================================================
// Bot Translation Middleware
//=========================================================

// Start generating tokens needed to use the translator API
tokenHandler.init();

// Can hardcode if you know that the language coming in will be chinese/english for sure
// can use the code for locale detection provided here: https://docs.botframework.com/en-us/node/builder/chat/localization/#navtitle
var FROMLOCALE = 'fr'; // fr locale
var TOLOCALE = 'en';

// Documentation for text translation API here: http://docs.microsofttranslator.com/text-translate.html
bot.use({
    receive: function (event, next) {
        if (event.type == "event" && event.name == "closechat") {
            bot.beginDialog(event.address, "*:endChat");
        }
        // console.log('HERI')
        if (event.textLocale == "fr" && event.type == "message") {
            var token = tokenHandler.token();
            if (token && token !== "") { //not null or empty string
                var urlencodedtext = urlencode(event.text); // convert foreign characters to utf8
                var options = {
                    method: 'GET',
                    url: 'http://api.microsofttranslator.com/v2/Http.svc/Translate' + '?text=' + urlencodedtext + '&from=' + FROMLOCALE + '&to=' + TOLOCALE,
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                };
                request(options, function (error, response, body) {
                    //Check for error
                    if (error) {
                        return console.log('Error:', error);
                    } else if (response.statusCode !== 200) {
                        return console.log('Invalid Status Code Returned:', response.statusCode);
                    } else {
                        // Returns in xml format, no json option :(
                        parseString(body, function (err, result) {
                            console.log(result.string._);
                            event.text = result.string._;
                            next();
                        });

                    }
                });
            } else {
                console.log("No token");
                next();
            }
        } else {
            next();
        }
    }
});
bot.set('localizerSettings', {
    botLocalePath: "./bot/customLocale",
    defaultLocale: "en"
});

// LUIS intergration
var model = process.env.LUIS_MODEL_URL;
if (model) {
    bot.recognizer(new builder.LuisRecognizer(model).onEnabled(function (context, callback) {
        var enabled = context.dialogStack().length === 0;
        callback(null, enabled);
    }));
}
bot.on('endOfConversation', function (message) {
    console.log("chat end");
});
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        // Bot is joining conversation
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                // User is joining conversation
                var address = Object.create(message.address);
                address.user = identity;
                var welcomeReply = new builder.Message()
                    .address(address)
                    .text(`Hi, I am ${identity.name}.`);
                bot.send(welcomeReply);

            }
        });
    }
});
bot.dialog('endChat', [(session, args, next) => {
    builder.Prompts.choice(session, "Do you want to end chat?", "Yes|No", { listStyle: builder.ListStyle.button, maxRetries: 0 });
},
(session, results, next) => {
    if (results.response.entity.toLowerCase() == "yes") {
        bot.beginDialog(session.message.address, "userform");
    } else {
        session.endDialog("I am still listening...");
    }
}
]).triggerAction({
    matches: [/endchat/i, /bye/i]
});
bot.dialog('firstRun', function (session) {
    session.userData.firstRun = true;
    session.send(`Welcome ${session.message.user.name}, how we may assist you?`).endDialog();
    if (!session.userData.location && session.message.user.location) {
        session.userData.location = session.message.user.location;
        console.log(`${session.message.user.id} => location: ${session.message.user.location.lat} ${session.message.user.location.lng}`)
        session.send(`New:=> We have detected you location. lat:${session.userData.location.lat} lng:${session.userData.location.lng}`);
    }
}).triggerAction({
    onFindAction: function (context, callback) {
        // Only trigger if we've never seen user before
        if (!context.userData.firstRun) {
            // Return a score of 1.1 to ensure the first run dialog wins
            callback(null, 1.1);
        } else {
            callback(null, 0.0);
        }
    }
});
bot.dialog('userform', [(session, args, next) => {
    if (session.message && session.message.value) {
        if (processSubmitAction(session, session.message.value)) {
            next();
            return;
        }
    }
    var msg = new builder.Message(session).addAttachment(data.adaptiveFormCard);
    session.send(msg);
}]).triggerAction({
    matches: [/form/i]
});
bot.dialog('locationmatch', [(session, args, next) => {
    session.sendTyping();
    // session.send(`current location in session => ${session.userData.location.lat} ${session.userData.location.lng}`);
    session.userData.location = session.userData.location || { lat: 28.622672500000004, lng: 77.0384206 };
    var options = {
        method: 'GET',
        url: `http://localhost:3978/api/region/${session.userData.location.lat}/${session.userData.location.lng}`
    };
    request(options, function (error, response, body) {
        //Check for error
        if (error) {
            session.send("svc_error").endDialog();
        } else if (response.statusCode !== 200) {
            session.send("svc_error").endDialog();
        } else {
            var data = JSON.parse(body);
            // session.send(`${data.region.region_name} ${data.region.subregion_name}`);
            if (data.svc instanceof Array) {
                var _cards = data.svc.map((op) => {
                    return new builder.ThumbnailCard(session)
                        .title(op.company_name)
                        //"city":"New Delhi","province_state":"Delhi","country":"India"
                        .subtitle(`${op.address_1} ${op.address_2}\n\n${op.city}, ${op.province_state}, ${op.country}`)
                        .text(`T: ${op.phone}\n\nE: ${op.email}\n\n${op.representative_name !== "" ? "Representative: " + op.representative_name : ""}`)
                });
                const msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel)
                msg.attachments(_cards);
                session.send(msg).endDialog();
            } else {
                session.send('svc_error').endDialog();
            }
        }
    })

}])

bot.dialog('rep', [(session, args, next) => {
    session.sendTyping();
    var regionLocation = builder.EntityRecognizer.findEntity(args.intent.entities, 'regionLocation');
    if (regionLocation) {
        if (regionLocation.entity.toLowerCase() === 'near') {
            session.endDialog();
            session.beginDialog("locationmatch");
        } else {
            next({ response: { hasEntity: true, entity: regionLocation.entity } });
        }
    } else {
        // no entities detected, ask user for a destination
        //builder.Prompts.text(session, 'Enter your State, Province, or Country to find your local Armstrong representative.');
        builder.Prompts.choice(session, "Find Armstrong Representative", "Near Me|Enter Region", { listStyle: builder.ListStyle.button });
    }
},
function (session, results, next) {
    if (results.response.hasEntity) {
        var region = results.response.entity;
        // check for near me and beginDialog locationmatch else v
        next({ response: region });
    } else {
        if (results.response.index === 0) {
            session.endDialog();
            session.beginDialog("locationmatch");
        } else {
            builder.Prompts.text(session, "Enter your State, Province, or Country to find your local Armstrong representative.");
        }
    }
},
function (session, results) {
    // session.send(results.response).endDialog();
    const regionText = results.response;
    session.sendTyping();
    var options = {
        method: 'GET',
        url: `https://armstrongfluidtechnology.herokuapp.com/api/regionloc/${regionText}`
    };
    request(options, function (error, response, body) {
        //Check for error
        if (error) {
            session.send("svc_error").endDialog();
        } else if (response.statusCode !== 200) {
            session.send("svc_error").endDialog();
        } else {
            var data = JSON.parse(body);
            // session.send(`${data.region.region_name} ${data.region.subregion_name}`);
            if (data.svc instanceof Array) {
                var _cards = data.svc.map((op) => {
                    return new builder.ThumbnailCard(session)
                        .title(op.company_name)
                        //"city":"New Delhi","province_state":"Delhi","country":"India"
                        .subtitle(`${op.address_1} ${op.address_2}\n\n${op.city}, ${op.province_state}, ${op.country}`)
                        .text(`T: ${op.phone}\n\nE: ${op.email}\n\n${op.representative_name !== "" ? "Representative: " + op.representative_name : ""}`)
                });
                const msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel)
                msg.attachments(_cards);
                session.send(msg).endDialog();
            } else {
                session.send('svc_error').endDialog();
            }
        }
    })
}
])
    .triggerAction({
        matches: [/location/i, /support/i, /Find a Rep/i, /representative/i]
    });


bot.dialog('pumpcard', dialogs.showPumpCard).triggerAction({ matches: [/mypump/i] })

bot.dialog('showMenu', dialogs.showMenu)
    .triggerAction({
        matches: [/menu/i, /options/i]
    });
bot.dialog('showProduct_Services', dialogs.showProducts)
    .triggerAction({
        matches: [/Products/i, /Product & Services/i]
    });
bot.dialog('support', dialogs.sayHello)
    .triggerAction({
        matches: [/help/i, /problem/i]
    });
bot.dialog('enter_region', [function (session) {
    builder.Prompts.text(session, "Enter your State, Province, or Country to find your local Armstrong representative.");
}, function (session, results) {
    // session.send(results.response).endDialog();
    const regionText = results.response;
    session.sendTyping();
    var options = {
        method: 'GET',
        url: `https://armstrongfluidtechnology.herokuapp.com/api/regionloc/${regionText}`
    };
    request(options, function (error, response, body) {
        //Check for error
        if (error) {
            session.send("svc_error").endDialog();
        } else if (response.statusCode !== 200) {
            session.send("svc_error").endDialog();
        } else {
            var data = JSON.parse(body);
            // session.send(`${data.region.region_name} ${data.region.subregion_name}`);
            if (data.svc instanceof Array) {
                var _cards = data.svc.map((op) => {
                    return new builder.ThumbnailCard(session)
                        .title(op.company_name)
                        //"city":"New Delhi","province_state":"Delhi","country":"India"
                        .subtitle(`${op.address_1} ${op.address_2}\n\n${op.city}, ${op.province_state}, ${op.country}`)
                        .text(`T: ${op.phone}\n\nE: ${op.email}\n\n${op.representative_name !== "" ? "Representative: " + op.representative_name : ""}`)
                });
                const msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel)
                msg.attachments(_cards);
                session.send(msg).endDialog();
            } else {
                session.send('svc_error').endDialog();
            }
        }
    })
}])
    .triggerAction({
        matches: [/Enter Region/]
    });
bot.dialog('near_me', [function (session) {
    // session.endDialog();
    session.beginDialog("locationmatch");
}])
    .triggerAction({
        matches: [/Near Me/]
    });
bot.dialog('heatAndCool', dialogs.showHeatCoolingOpt)
    .triggerAction({
        matches: [/Heating & Cooling/i, /Heating and Cooling/i]
    });
bot.dialog('pumps', dialogs.showPupms)
    .triggerAction({
        matches: [/Commercial Pumps/i, /Commercial/i]
    });

bot.dialog('pumps_detail', [(session, args, next) => {
    session.sendTyping();
    var pumpEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'pumpId');
    if (pumpEntity) {
        next({ response: pumpEntity.entity });
    } else {
        // no entities detected, ask user for a destination
        builder.Prompts.text(session, 'ask_pump');
    }
},
function (session, results) {
    var pumpId = results.response;

    const pump = pumpHelper.getPumps(pumpId);
    if (pump) {
        const _card = new builder.ThumbnailCard(session)
            .title(pump.title)
            .subtitle(pump.Applications)
            .text(pump.Description)
            .images([
                builder.CardImage.create(session, pump.image)
            ])

        const _msg = new builder.Message(session).addAttachment(_card);
        session.send(_msg).endDialog();
    } else {
        session.send('NO_PUMP').endDialog();
    }

}
]).triggerAction({
    matches: 'intent.pumps',
    intentThreshold: 0.65
});
bot.dialog('finish', function (session, args, next) {
    var closeChatreply = createEvent("closechatconfirmed", "closechatconfirmed", session.message.address);
    session.send(closeChatreply);
})
    .triggerAction({
        matches: /^finish$/i,
    });

bot.dialog('help', function (session, args, next) {
    //Send a help message
    session.beginDialog('/');
})
    // Once triggered, will start a new dialog as specified by
    // the 'onSelectAction' option.
    .triggerAction({
        matches: /^help$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the top of the dialog stack 
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });

bot.on('error', function (e) {
    console.log('And error ocurred', e);
});


function processSubmitAction(session, value) {
    var defaultErrorMessage = 'Please enter valid email and contact no.';
    switch (value.type) {
        case 'userdetails':
            if (validateForm(value)) {
                // proceed to sendmail
                console.log("sendmail");
                sendMailFeedback(session);
                return true;
            } else {
                session.send(defaultErrorMessage);
                return false;
            }
            break;

        default:
            // A form data was received, invalid or incomplete since the previous validation did not pass
            session.send(defaultErrorMessage);
            return false;
    }
}
function validateForm(userdetails) {
    if (!userdetails) {
        return false;
    }
    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    //email
    var hasEmail = typeof userdetails.emailid === 'string' && reg.test(userdetails.emailid);
    //mobileno
    var hasMobNo = typeof userdetails.contactno === 'string' && /^\d{10}$/.test(userdetails.contactno);
    console.log(`mail=> ${hasEmail}, contact no => ${hasMobNo}`);
    return hasEmail && hasMobNo;
}
function sendMailFeedback(session) {
    const { type, emailid, contactno } = session.message.value;
    if (type == 'userdetails') {
        //send email
        var body = {
            starttime: '',
            endtime: '',
            phoneno: contactno,
            email: emailid + `, ${process.env.SUPPORT_EMAILID}`,
            chathistory: ''
        };
        var options = {
            method: 'POST',
            url: `http://localhost:3978/api/sendmail`,
            body: body,
            json: true
        };
        request(options, function (error, response, body) {
            //Check for error
            if (error) {
                console.log(error)
                session.send("svc_error").endDialog();
            } else {
                console.log(response.statusCode);
                session.send("GoodBye");
                var closeChatreply = createEvent("closechatconfirmed", "closechatconfirmed", session.message.address);
                session.send(closeChatreply).endDialog();
            }
        })
    }
}
const createEvent = (eventName, value, address) => {
    var msg = new builder.Message().address(address);
    msg.data.type = "event";
    msg.data.name = eventName;
    msg.data.value = value;
    return msg;
}
module.exports = bot;
