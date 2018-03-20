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
    connector, dialogs.defaultMsg
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


function saveHistory(userId, username, message) {
    var body = {
        userid: userId,
        username: username,
        message: message,
        timestamp: (new Date()).getTime()
    };
    var options = {
        method: 'POST',
        url: `https://armstrongfluidtechnology.herokuapp.com/api/userhistory`,
        body: body,
        json: true
    };
    request(options, function (error, response, body) {
        //Check for error
        if (error) {
            console.log(error);
        }
    })
}

bot.use({
    receive: function (event, next) {
        //console.log("receive => ",event);
        event.type === "message" && saveHistory(event.user.id, event.user.name, event.text);
        console.log(event.user.id, event.user.name, event.text);
        next();
    },
    send: function (event, next) {
        if (event.type !== "typing" && event.type === "message") {
            var text = event.text;
            if (!event.text) {
                text = "Dialog reply from Bot";
            }

            // console.log("send => ",event);
            saveHistory(event.address.user.id, "John", text);
            console.log(event.address.user.id, "Bot", text);
        }
        next();
    }
});

bot.use(builder.Middleware.sendTyping());
// Documentation for text translation API here: http://docs.microsofttranslator.com/text-translate.html
bot.use({
    receive: function (event, next) {
        if (event.type == "event" && event.name == "closechat") {
            console.log(JSON.stringify(event));
            bot.beginDialog(event.address, "*:endChat");
        }
        if (event.type == "event" && event.name == "startchat") {
            bot.beginDialog(event.address, "*:greetings");
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
console.log(model);
if (model) {
    bot.recognizer(new builder.LuisRecognizer(model).onEnabled(function (context, callback) {
        var enabled = context.dialogStack().length === 0;
        callback(null, enabled);
    }));
}
bot.on('endOfConversation', function (message) {
    console.log("chat end");
});

bot.dialog('greetings', [
    function (session) {
        session.userData.userid = session.message.user.id;
        session.userData.location = session.message.user.location;
        session.userData.username = session.message.user.name;
        session.userData.starttime = (new Date()).toTimeString().substring(0, 8);
        const _locale = session.message.user.locale || session.message.textLocale || 'en';
        session.message.textLocale = _locale;
        const nsg = _locale != "fr" ?
            `Welcome ${session.userData.username || 'Guest'}! \n\n How may I assist you ?`
            : `Bienvenue ${session.userData.username || 'Guest'}! \n\n Comment puis-je vous aider?`;
        if (session.userData.location && session.userData.location.lat && session.userData.location.lng) {
            //get location and save to user data
            var options = {
                method: 'GET',
                url: `https://armstrongfluidtechnology.herokuapp.com/api/location/${session.userData.location.lat}/${session.userData.location.lng}`,
                json: true
            };
            request(options, function (error, response, body) {
                if (error) {
                    session.send(nsg);
                    // var msg = new builder.Message(session).addAttachment(data.defaultCard);
                    // session.send(msg).endDialog();
                    dialogs.defaultCardWithImBack(session);
                } else if (response.statusCode === 200) {
                    session.userData.locationtext = body.location
                    session.send(nsg);
                    // session.send('How may I assist you ?');
                    // var msg = new builder.Message(session).addAttachment(data.defaultCard);
                    // session.send(msg).endDialog();
                    dialogs.defaultCardWithImBack(session);
                }
            });
        } else {
            session.send(nsg);
            dialogs.defaultCardWithImBack(session);
        }
    }
]).triggerAction({
    matches: [/greet/i]
});
bot.dialog('endChat', [(session, args, next) => {
    builder.Prompts.choice(session, "chat_end", "Yes|No", { listStyle: builder.ListStyle.button, maxRetries: 0, retryPrompt: 'Please select a valid option.' });
}, (session, results, next) => {
    if (!results.response) {
        // start over here
        session.send("context_error");
        session.endDialog();
        session.beginDialog("error");
        return;
    }
    if (results.response.entity.toLowerCase() == "yes" || results.response.entity.toLowerCase() == "oui") {
        session.userData.fromEndChat = true;
        if (!session.userData.isFormFilled) {
            builder.Prompts.choice(session,
                "shareInfo", "Yes|No", { listStyle: builder.ListStyle.button, maxRetries: 0, retryPrompt: 'Please select a valid option.' });
        }
        else {
            sendMailFeedback(session);
        }
    } else {
        session.userData.fromEndChat = false;
        session.beginDialog("/");
    }
},
(session, results, next) => {
    if (!results.response) {
        // start over here
        session.send("context_error");
        session.endDialog();
        session.beginDialog("error");
        return;
    }
    if (results.response.entity.toLowerCase() == "yes" || results.response.entity.toLowerCase() == "oui") {
        session.beginDialog("userform");
    } else {
        var closeChatreply = createEvent("closechatconfirmed", "closechatconfirmed", session.message.address);
        session.send(closeChatreply);
        session.send("GoodBye").endDialog();
        session.userData = {};
    }
}
]).triggerAction({
    matches: [/endchat/i]
});
bot.dialog('thanks', [(session) => {
    session.send("welcome").endDialog();
}]).triggerAction({
    matches: 'intent.thanks',
    intentThreshold: 0.65
});
bot.dialog('comingSoon', [(session) => {
    session.send("cmsoon").endDialog();
}]).triggerAction({
    matches: [/Results & Expertise/i, /Resources & Tools/i, /About Armstrong/i]
});
bot.dialog('whois', [(session) => {
    session.send("whoisMsg").endDialog();;
}]).triggerAction({
    matches: 'intent.whois',
    intentThreshold: 0.65
});
bot.dialog('bye', [(session) => {
    session.send("thankYou").endDialog();;
}]).triggerAction({
    matches: 'intent.bye',
    intentThreshold: 0.65
});
bot.dialog('support', [(session) => {
    const nsg = session.message.textLocale != "fr" ? `Hi ${session.userData.username}` : `salut ${session.userData.username}`;
    session.send(nsg);
    // var msg = new builder.Message(session).addAttachment(data.defaultCard);
    // session.send(msg).endDialog();
    dialogs.defaultCardWithImBack(session);
}]).triggerAction({
    matches: 'intent.say',
    intentThreshold: 0.65
});

bot.dialog('userform', [(session, args, next) => {
    if (session.message.text &&
        session.userData.formStart &&
        !["support", "help", "help & support", "connect me to human", "yes", "no"].includes(session.message.text.toLowerCase())) {
        session.userData.formStart = false;
        if (session.userData.fromEndChat) {
            session.send("GoodBye").endDialog();
        }
        else {
            session.endDialog();
            session.beginDialog('support');
        }
        return;
    }
    if (session.userData.isFormFilled) {
        session.endDialog("We already have your details and our Customer Service team will contact you soon to discuss.");
        return;
    }
    if (session.message && session.message.value) {
        if (processSubmitAction(session, session.message.value)) {
            session.userData.formStart = false;
            return;
        }
    }
    if (!session.userData.fromEndChat) {
        session.userData.helpRequested = true;
    }
    var msg = new builder.Message(session).addAttachment(data.adaptiveFormCard);
    session.send(msg);
    session.userData.formStart = true;
}]).triggerAction(
    {
        matches: 'intent.support',
        intentThreshold: 0.65
    });
bot.dialog('locationmatch', [(session, args, next) => {
    session.sendTyping();

    var options = {
        method: 'GET',
        url: `https://armstrongfluidtechnology.herokuapp.com/api/region/${session.userData.location.lat}/${session.userData.location.lng}`
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
        var choiceHeader = session.message.textLocale != "fr" ? "Find a Representative" : "Trouver un représentant";
        "Trouver un représentant"
        if (session.userData.locationtext) {
            choiceHeader = session.message.textLocale != "fr" ?
                `I see your location is: ${session.userData.locationtext},\n\n Do you want to find a representative near you?` :
                `Je vois que votre emplacement est: ${session.userData.locationtext},\n\n Voulez-vous trouver un représentant près de chez vous?`
            builder.Prompts.choice(session, choiceHeader, "Yes|No", { listStyle: builder.ListStyle.button, maxRetries: 0, retryPrompt: 'Please select a valid option.' });
        }
        else {
            builder.Prompts.text(session, "getState");
        }
    }
},
function (session, results, next) {
    if (!results.response) {
        // start over here
        session.send("context_error");
        session.endDialog();
        session.beginDialog("error");
        return;
    }
    if (results.response.hasEntity) {
        var region = results.response.entity;
        // check for near me and beginDialog locationmatch else v
        next({ response: region });
    } else {
        if (results.response.index === 0) {
            session.endDialog();
            session.beginDialog("locationmatch");
        } else {
            builder.Prompts.text(session, "getState");
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
            if (data.hasSubRegion) {
                session.send("select_sub");
                var _cards = data.svc.map((op) => {
                    return new builder.HeroCard(session)
                        .title(op.subregion_name)
                        .subtitle(op.region_name)
                        .tap(
                        builder.CardAction.imBack(session, `find a rep in ${op.subregion_name}, ${op.region_name}`, "Select"));
                });
                const msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel)
                msg.attachments(_cards);
                session.send(msg).endDialog();
            }
            else if (data.defaultList) {
                let norepMsg =
                    session.message.textLocale == "fr" ?
                        `Nous n'avons pas eu de représentant des ventes à ${regionText} \n\n S'il vous plaît choisir des régions de quelques options disponibles ci-dessous:` :
                        `We did not have any sales representative in ${regionText} \n\n Please choose regions from few available options below: `;
                session.send(norepMsg);
                var _cards = data.svc.map((op) => {
                    return new builder.HeroCard(session)
                        .title(op)
                        .subtitle(`Find a rep in ${op}`)
                        .tap(
                        builder.CardAction.imBack(session, `find a rep in ${op}`, "Select"));
                });
                const msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel)
                msg.attachments(_cards);
                session.send(msg).endDialog();
            }
            else if (!data.defaultList && data.svc instanceof Array) {
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
            }

            else {
                session.send('svc_error').endDialog();
            }
        }
    })
}
]).triggerAction({
    matches: 'intent.rep',
    intentThreshold: 0.65
});

bot.dialog('error', dialogs.defaultMsg);
bot.dialog('showMenu', dialogs.showMenu)
    .triggerAction({
        matches: 'intent.menu',
        intentThreshold: 0.65
    });
bot.dialog('showProduct_Services', dialogs.showProducts)
    .triggerAction({
        matches: 'intent.products',
        intentThreshold: 0.65
    });

bot.dialog('enter_region', [function (session) {
    builder.Prompts.text(session, "getState");
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
            if (data.hasSubRegion) {
                session.send("select_sub");
                var _cards = data.svc.map((op) => {
                    return new builder.HeroCard(session)
                        .title(op.subregion_name)
                        .subtitle(op.region_name)
                        .tap(
                        builder.CardAction.imBack(session, `find a rep in ${op.subregion_name}, ${op.region_name}`, "Select"));
                });
                const msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel)
                msg.attachments(_cards);
                session.send(msg).endDialog();
            }
            else if (data.defaultList) {
                let norepMsg =
                    session.message.textLocale == "fr" ?
                        `Nous n'avons pas eu de représentant des ventes à ${regionText} \n\n S'il vous plaît choisir des régions de quelques options disponibles ci-dessous:` :
                        `We did not have any sales representative in ${regionText} \n\n Please choose regions from few available options below: `;
                session.send(norepMsg);
                var _cards = data.svc.map((op) => {
                    return new builder.HeroCard(session)
                        .title(op)
                        .subtitle(`Find a rep in ${op}`)
                        .tap(
                        builder.CardAction.imBack(session, `find a rep in ${op}`, "Select"));
                });
                const msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel)
                msg.attachments(_cards);
                session.send(msg).endDialog();
            }
            else if (!data.defaultList && data.svc instanceof Array) {
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
            }
            else {
                session.send('svc_error').endDialog();
            }
        }
    })
}]).triggerAction({
    matches: [/Enter Region/]
});
bot.dialog('near_me', [function (session) {
    session.beginDialog("locationmatch");
}])
    .triggerAction({
        matches: [/Near Me/]
    });
bot.dialog('heatAndCool', dialogs.showHeatCoolingOpt)
    .triggerAction({
        matches: 'intent.heatAndCool',
        intentThreshold: 0.65
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
}, function (session, results) {
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

        // setTimeout(function () {
        //     session.send(msg).endDialog();
        // }, 5000);

    } else {
        session.send('NO_PUMP').endDialog();
    }

}
]).triggerAction({
    matches: 'intent.pumps',
    intentThreshold: 0.65
});

bot.on('error', function (e) {
    console.log('And error ocurred', e);
});


function processSubmitAction(session, value) {
    let defaultErrorMessage =
        session.message.textLocale == "fr" ?
            'Veuillez entrer un e-mail valide et ne pas contacter.' : 'Please enter valid email and contact no.';
    switch (value.type) {
        case 'userdetails':
            if (validateForm(value)) {
                // proceed to sendmail
                session.userData.isFormFilled = true;
                session.userData.formDetails = session.message.value;
                session.endDialog("allDone");
                sendMailFeedback(session);
                return true;
            } else {
                session.send(defaultErrorMessage);
                return false;
            }
            break;
        case 'cancel':
            session.userData.isFormFilled = false;
            if (session.userData.fromEndChat) {
                var closeChatreply = createEvent("closechatconfirmed", "closechatconfirmed", session.message.address);
                session.send(closeChatreply);

                session.send("GoodBye").endDialog();
                session.userData = {};
            } else {
                session.endDialog();
                session.beginDialog('support');
            }
            return true;
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
    var hasMobNo = typeof userdetails.contactno === 'string';// && /^\d{10}$/.test(userdetails.contactno);
    console.log(`mail=> ${hasEmail}, contact no => ${hasMobNo}`);
    return hasEmail && hasMobNo;
}
function sendMailFeedback(session) {
    const { type, emailid, contactno } = session.userData.formDetails;
    // session.send(`Close flag is ${session.userData.fromEndChat}`);
    let fromEndChat = session.userData.fromEndChat;
    if (type == 'userdetails') {
        request(`https://armstrongfluidtechnology.herokuapp.com/api/userhistory/${session.userData.userid}`,
            function (error, response, history) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("history",history);
                    // send email
                    var body = {
                        username: session.userData.username,
                        userid: session.userData.userid,
                        starttime: session.userData.starttime,
                        endtime: !session.userData.fromEndChat ? "" : (new Date()).toTimeString().substring(0, 8),
                        phoneno: contactno,
                        email: emailid,
                        chathistory: history,
                        AskForHelp: session.userData.helpRequested ? "Yes" : "",
                        location: session.userData.locationtext
                    };
                    var options = {
                        method: 'POST',
                        url: `https://armstrongfluidtechnology.herokuapp.com/api/sendmail`,
                        body: body,
                        json: true
                    };
                    request(options, function (error, response, body) {
                        //Check for error
                        if (error) {
                            console.log(error)
                            session.send("svc_error").endDialog();
                        } else {
                            if (fromEndChat) {
                                var closeChatreply = createEvent("closechatconfirmed", "closechatconfirmed", session.message.address);
                                session.send(closeChatreply);

                                session.send("GoodBye").endDialog();
                                session.userData = {};
                            }
                        }
                    })
                }
            });
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