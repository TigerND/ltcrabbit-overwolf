/** 
* Overwolf API Javascript wrapper License
* ---------------------------------------------------------------
* the use of this code for commercial uses requires the written
* authorization of the author.
*
* enjoy. :-)
*
* Gil@Overwolf.com
*/

function pollForWindowLocation() {
    if (OverwolfAPI.Windows.left != window.screenX
        || OverwolfAPI.Windows.top != window.screenY) {
        OverwolfAPI.Windows.left = window.screenX;
        OverwolfAPI.Windows.top = window.screenY;
        if (OverwolfAPI.Windows.onRectChange != null) {
            OverwolfAPI.Windows.onRectChange(OverwolfAPI.Windows.left, OverwolfAPI.Windows.top, OverwolfAPI.Windows.width, OverwolfAPI.Windows.height);
        }
    }

    setTimeout('pollForWindowLocation()', 100);
}

var isIE = (navigator.appName == "Microsoft Internet Explorer");
var hasFocus = true;
var active_element;

function stateChanged() {
    if (document.hidden || document.webkitHidden || document.msHidden) {
        document.getElementById("DebugContainer").innerHTML += 'Hidden|';
        OverwolfAPI.SetWindowIsShown(false);
        //new tab or window minimized
        timer = new Date().getTime();
    }
    else {
        document.getElementById("DebugContainer").innerHTML += 'Visible|';
        OverwolfAPI.SetWindowIsShown(true);
    }
}

document.addEventListener("visibilitychange", stateChanged);
document.addEventListener("webkitvisibilitychange", stateChanged);
document.addEventListener("msvisibilitychange", stateChanged);

function returnDocument() {
    var file_name = document.location.href;
    var end = (file_name.indexOf("?") == -1) ? file_name.length : file_name.indexOf("?");
    return file_name.substring(file_name.lastIndexOf("/") + 1, end);
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
}

// Create overwolfAPI from the simulator only if not created before by Overwolf, e.g. only when running from external browser
if (OverwolfAPI == undefined || OverwolfAPI == null) {
    var OverwolfAPI = new OverwolfAPIObj();
}

var simulatorMode = getQueryVariable('simulator');
var myWindow = window;
var consoleWindow = window;
if (simulatorMode == "on") {
    myWindow = window.open(returnDocument() + '?simulator=console', '1', 'width=1024,height=768');
    window.location = "about:blank";
}
else if (simulatorMode == "console") {
    consoleWindow = window.open('OverwolfSimulationConsole.html', 'Overwolf_Simulator_Console', 'width=800,height=600');
}
else if ((simulatorMode == "" || simulatorMode == undefined)) {
    consoleWindow = window.open("", "Overwolf_Simulator_Console");
    if (consoleWindow != null && consoleWindow != undefined && consoleWindow.simulatorWindowOpened == true) {
        consoleWindow.attachToParent();
    }
}

OverwolfAPI.Connect();

function OverwolfAPIObj() {
    this.Connect = function () {
        pollForWindowLocation();
        window.onresize = function () {
            OverwolfAPI.Windows.width = window.outerWidth;
            OverwolfAPI.Windows.height = window.outerHeight;
            if (OverwolfAPI.Windows.onRectChange != null) {
                OverwolfAPI.Windows.onRectChange(OverwolfAPI.Windows.left, OverwolfAPI.Windows.top, OverwolfAPI.Windows.width, OverwolfAPI.Windows.height);
            }
        }
    }

    // Window:
    this.Windows = {
        // Vars:
        top: window.screenY,
        left: window.screenX,
        width: window.outerWidth,
        height: window.outerHeight,
        isShown: null,

        // Methods:
        GetWindowRect: function (callback) {
            var callbackFunc = eval(callback);
            if (callbackFunc != null) {
                callbackFunc(OverwolfAPI.Windows.top, OverwolfAPI.Windows.left, OverwolfAPI.Windows.width, OverwolfAPI.Windows.height);
            }
        },
        GetWindowIsShown: function (callback) {
            var callbackFunc = eval(callback);
            if (callbackFunc != null) {
                callbackFunc(OverwolfAPI.Windows.isShown);
            }
        },
        SetWindowRect: function (x, y, width, height, changePosition, changeSize) {
            if (changePosition) {
                myWindow.moveTo(x, y);
            }
            if (changeSize) {
                myWindow.resizeTo(width, height);
            }
        },

        // Events:
        onRectChange: null,
        onShownChange: null
    };

    this.Game = {
        // Vars:
        isInGame: null,
        isGameRunning: null,
        gameTitle: null,
        gameId: null,
        gameWidth: null,
        gameHeight: null,

        // Methods:
        GetInfo: function (callback) {
            var callbackFunc = eval(callback);
            if (callbackFunc != null) {
                callbackFunc(OverwolfAPI.Game.isInGame, OverwolfAPI.Game.isGameRunning, OverwolfAPI.Game.gameTitle, OverwolfAPI.Game.gameId);
            }
        },
        GetResolution: function (callback) {
            var callbackFunc = eval(callback);
            if (callbackFunc != null) {
                callbackFunc(screen.width, screen.height, OverwolfAPI.Game.gameWidth, OverwolfAPI.Game.gameHeight);
            }
        },

        // Events:
        onGameChange: null,
        onResolutionChanged: null
    };

    this.Media = {
        // Vars:
        screenshotUrl: null,
        screenshotSuccess: null,

        // Methods:
        TakeScreenshot: function (callback) {
            var callbackFunc = eval(callback);
            if (callbackFunc != null) {
                callbackFunc(OverwolfAPI.Media.screenshotUrl, OverwolfAPI.Media.screenshotSuccess);
            }
        },
        ShareImage: function (title, imageData) {
            var imageDataStr = "Not null";
            if (imageData == null) {
                imageDataStr = "null";
            }
        }
    };


    // OverwolfAPI Methods:
    this.Windows_RegisterOnWindowRectChanged = function (frameName, callback) {
        OverwolfAPI.Windows.onRectChange = eval(callback);
    }

    this.Windows_GetWindowRect = function (frameName, callback) {
        OverwolfAPI.Windows.GetWindowRect(callback);
    }

    this.Windows_RegisterOnWindowIsShownChanged = function (frameName, callback) {
        OverwolfAPI.Windows.onShownChange = eval(callback);
    }

    this.Windows_GetWindowIsShown = function (frameName, callback) {
        OverwolfAPI.Windows.GetWindowIsShown(callback);
    }

    this.Game_RegisterOnGameInfoChanged = function (frameName, callback) {
        OverwolfAPI.Game.onGameChange = eval(callback);
    }

    this.Game_GetInfo = function (frameName, callback) {
        OverwolfAPI.Game.GetInfo(callback);
    }

    this.Game_RegisterOnResolutionChanged = function (frameName, callback) {
        OverwolfAPI.Game.onResolutionChanged = eval(callback);
    }

    this.Game_GetResolution = function (frameName, callback) {
        OverwolfAPI.Game.GetResolution(callback);
    }

    this.Windows_SetWindowRect = function (x, y, width, height, changePosition, changeSize) {
        OverwolfAPI.Windows.SetWindowRect(x, y, width, height, changePosition, changeSize);
    }

    this.Content_TakeScreenshot = function (frameName, callback) {
        OverwolfAPI.Media.TakeScreenshot(callback);
    }

    this.Content_ShareImage = function (title, imageData) {
        OverwolfAPI.Media.ShareImage(title, imageData);
    }


    // FromDebugConsole:
    this.SetGameInfo = function (isGameInFocus, isGameRunning, gameTitle, gameId) {
        OverwolfAPI.Game.isInGame = isGameInFocus;
        OverwolfAPI.Game.isGameRunning = isGameRunning;
        OverwolfAPI.Game.gameTitle = gameTitle;
        OverwolfAPI.Game.gameId = gameId;
        if (OverwolfAPI.Game.onGameChange != null && OverwolfAPI.Game.onGameChange != undefined) {
            OverwolfAPI.Game.onGameChange(isGameInFocus, isGameRunning, gameTitle, gameId);
        }
    }

    this.SetGameResolution = function (width, height) {
        OverwolfAPI.Game.gameWidth = width;
        OverwolfAPI.Game.gameHeight = height;
        if (OverwolfAPI.Game.onResolutionChanged != null && OverwolfAPI.Game.onResolutionChanged != undefined) {
            OverwolfAPI.Game.onResolutionChanged(screen.width, screen.height, width, height, OverwolfAPI.Game.isInGame);
        }
    }

    this.SetWindowIsShown = function (isShown) {
        OverwolfAPI.Windows.isShown = isShown;
        if (OverwolfAPI.Windows.onShownChange != null && OverwolfAPI.Windows.onShownChange != undefined) {
            OverwolfAPI.Windows.onShownChange(isShown);
        }
    }

    this.SetScreenshotInfo = function (screenshotUrl, screenshotSuccess) {
        OverwolfAPI.Media.screenshotUrl = screenshotUrl;
        OverwolfAPI.Media.screenshotSuccess = screenshotSuccess;
    }

}
