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
        if(op.image){
            card.images([builder.CardImage.create(session, op.image)])
        }
        return card;
    });
    return _getDefaultOptions;
}
const showMenu = function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments(getDefaultOptions(session, data.defaultOptions));
    session.send(msg).endDialog();
}
const showProducts = function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments(getDefaultOptions(session, data.products));
    session.send(msg).endDialog();
}
const showPupms = function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments(getDefaultOptions(session, data.pumps));
    session.send(msg).endDialog();
}
const pumpDetails = function(session){
    session.send('Comming soon').endDialog();
}


module.exports = {
    sayHello: [
        (session, args, next) => {
            const botName = 'thatBot';
            // session.send(`Hi there! I'm ${botName}`);
            session.endConversation(`Here's what I can do:
            \n\n Menu
            \n\n Products
            \n\n Commercial Pumps`);
        },
    ],
    showMenu,
    showProducts,
    showPupms,
    pumpDetails
};
