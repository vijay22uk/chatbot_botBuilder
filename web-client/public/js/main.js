var botConnection = new BotChat.DirectLine({ secret: 'gK1uEv3h91E.cwA.cfs.brX58MrxZPWRft0smq-wrDQlywMbUKJNo_EgiAQE58E' });
var user = {};
g_locale = "en";
function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() +  '_' + Math.random();
  }
var bot = { id: '7d1bbb86-c243-4ad6-a6c8-c54dd542eb44' };
function app(locale, location, name) {
    g_locale = locale;
    user.name = name,
    user.id = name.replace(/ /g, '_') + '_' + guid();
    user.location = location;
    user.locale = locale;
    BotChat.App({
        botConnection: botConnection,
        user: user,
        bot: bot,
        resize: 'detect',
        locale: locale
    }, document.getElementById("chat-window"));

    botConnection.activity$
        .filter(activity => activity.type === "event")
        .subscribe(activity => {
            console.log(activity);
            if (activity.name === "closechatconfirmed") {
                console.log("closing...");
                closechat(activity.value);
            }
            // if (activity.name === "usernamechange") {
            //     updateUserName(activity.value);
            // }
        })
    // botConnection.activity$
    // .filter(activity => activity.type === "message")
    // .subscribe(activity => {
    //     updateUserName();
    // }) 
};

function sendFromBackChannel(name, value) {
    botConnection
        .postActivity({ type: "event", value: value, from: user, name: name, textLocale:  g_locale })
        .subscribe(id => console.log("success"));
}

