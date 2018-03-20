const builder = require('botbuilder');
const data = require('../data');

const getDefaultOptions = function (session, list) {
    let _getDefaultOptions = list.map((op) => {
        const card = new builder.HeroCard(session)
            .title(op.title);
        if (op.isEnabled) {
            card.tap(
                builder.CardAction.imBack(session, op.title, "Select"));
        }
        if (op.image) {
            card.images([builder.CardImage.create(session, op.image)])
        }
        return card;
    });
    return _getDefaultOptions;
}
const showMenu = function (session) {
    session.send("offerings");
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments(getDefaultOptions(session, data.defaultOptions));
    session.send(msg).endDialog();
}
const showProducts = function (session) {
    session.send("offerings_products");
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments(getDefaultOptions(session, data.products));
    session.send(msg).endDialog();
}
const showPupms = function (session) {

    session.send("offerings_p");
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments(getDefaultOptions(session, data.pumps));
    session.send(msg).endDialog();
}
const pumpDetails = function (session) {
    session.send('Comming soon').endDialog();
}
const showUserDetailsForm = function (session) {
    var msg = new builder.Message(session).addAttachment(data.adaptiveFormCard);
    session.send(msg);
}
const showHeatCoolingOpt = function (session) {
    session.send("offerings_h");
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments(getDefaultOptions(session, data.heatingCooling));
    session.send(msg).endDialog();
}
const showPumpCard = function (session) {
    var msg = new builder.Message(session).addAttachment(data.pumpCard);
    session.send(msg);
}
const showNearestLocation = function (session) {
    session.send(new builder.message(session).addAttachment(data.locationCard)).endDialog()
}
const defaultCardWithImBack = (session)=>{
    const titlemsg = session.message.textLocale != "fr" ? `Here's what I can do:`: `Voici ce que je peux faire:`;
    const heroCard = new builder.HeroCard(session)
    .title(titlemsg)
    .buttons([
        builder.CardAction.imBack(session, "Products & services" , "Products & services"),
        builder.CardAction.imBack(session, "Results & Expertise" , "Results & Expertise"),
        builder.CardAction.imBack(session, "Resources & Tools" , "Resources & Tools"),
        builder.CardAction.imBack(session, "About Armstrong" , "About Armstrong"),
        builder.CardAction.imBack(session, "Help & Support" , "Help & Support"),
        builder.CardAction.imBack(session, "Find a Rep" , "Find a Rep")
    ]);
    var msg = new builder.Message(session).addAttachment(heroCard);
    session.send(msg).endDialog();
}
module.exports = {
    sayHello: [
        (session, args, next) => {
            defaultCardWithImBack(session);
        },
    ],
    defaultMsg: [
        (session, args, next) => {
            session.send("defaultMsg");
            // session.endDialog();
            defaultCardWithImBack(session)
            // session.endConversation();
        },
    ],
    showMenu,
    showProducts,
    showPupms,
    pumpDetails,
    showHeatCoolingOpt,
    showUserDetailsForm,
    showPumpCard,
    defaultCardWithImBack
};
