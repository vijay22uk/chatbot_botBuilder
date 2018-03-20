var botConnection = new BotChat.DirectLine({ secret: 'AuUYCko2LIY.cwA.hfs.WtSZ9NQcuWL4R-zb85PF5G_k686CdujSJwYsnvyexkE' });
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
var bot = { id: 'd0c30f9d-1f93-4cc8-ad42-9009d07bacc5' };
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

