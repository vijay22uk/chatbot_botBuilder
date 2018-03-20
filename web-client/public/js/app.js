var once = true;
function readOutLoud(message) {
    var speech = new SpeechSynthesisUtterance();

    // Set the text and voice attributes.
    speech.text = message;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
}

function closechat(value) {
    $(".chat-window-container").css("width", "0");
    $(".bot-launcher-open-icon").show();
    $(".bot-launcher-close-icon").hide();
    $(".close-icon-container").hide();
    location.reload();
}
function initSpeechRecognition() {
    //Voice Recognistion
    try {
        var started = false;
        var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        $(".wc-mic").off()
        $(".wc-mic").removeClass("wc-mic hidden inactive").addClass("wc-mic");
        $('.wc-mic').on('click', function (e) {
            if (!started) {
                recognition.start();
                started = true;
                $('.wc-console .wc-mic svg').css("fill", "#0078d7");
            }
            else {
                recognition.stop();
                started = false;
                $('.wc-console .wc-mic svg').css("fill", "#8a8a8a");
            }
        });
        recognition.onstart = function () {
            readOutLoud('Voice On');
            console.log('Voice On.');
        }

        recognition.onspeechend = function () {
            readOutLoud('Voice Off')
            console.log('Voice Off.');
        }

        recognition.onerror = function (event) {
            if (event.error == 'no-speech') {
                readOutLoud('Did not recognise. Try again.');
            };
        }
        recognition.onresult = function (event) {
            var current = event.resultIndex;

            var transcript = event.results[current][0].transcript;
            var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

            if (!mobileRepeatBug) {
                var textRecognised = $(".wc-console .wc-textbox input").val();
                textRecognised += transcript;
                $(".wc-console .wc-textbox input").val(textRecognised)
            }
        }
    }
    catch (e) {
        console.error(e);
    }
}
var secret = 'pEmeg3MEGlE.cwA.HeU.zOXwBT8NSiZbHslM9XwJMI3bPHpxMvdGS503AIq5SiM';
var token, streamUrl, conversationId;
$(document).ready(function () {
    var location = { lat: 0, lng: 0 }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            location = pos;
        });
    }
    $("#btnContinue").click(function () {
        var username = $('#username').val()
        var language = $('.selectLocale').val();

        if (language) {
            $(".wc-chatview-panel").remove();
            app(language, location, username);
            sendFromBackChannel("startchat", "startchat")
            $(".chat-window-container").css("height", "calc(100% - 20px - 75px - 20px)");
            $(".wc-header").html("<span>Welcome to Armstrong</span>");
            $(".wc-upload").remove();
            $("#wc-upload-input").remove();
            $(".close-icon-container").show();
        }
    });
    $(".chat-window-container").css("height", "0");
    // initSpeechRecognition()
    $(".bot-launcher-open-icon").click(function () {
        if (once) {
            $(".chat-window-container").animate({
                "width": "370px"
            }, 3000, 'swing');
            once = false;
        } else {
            $(".chat-window-container").css("width", "370px");
        }
        // $(".chat-window-container").css("width", "370px");
        $(".bot-launcher-close-icon").show();
        $(".bot-launcher-open-icon").hide();
        $(".close-icon-container").show();

    });
    $(".close-icon-container").click(function () {
        sendFromBackChannel("closechat", "closechat");
    });
    $(".bot-launcher-close-icon").click(function () {
        $(".close-icon-container").hide();
        $(".chat-window-container").css("width", "0px");
        $(".bot-launcher-open-icon").show();
        $(".bot-launcher-close-icon").hide();
    });

    // trigger chat oepn
    $(".bot-launcher-open-icon").click();
});