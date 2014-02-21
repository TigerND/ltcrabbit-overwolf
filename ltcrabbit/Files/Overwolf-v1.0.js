/** 
* Overwolf API Javascript wrapper License
* ---------------------------------------------------------------
* the use of this code for commercial uses requires the written
* authorization of the author.
*
* enjoy. :-)
*
* Gil@overwolf.com
*/

/**
* @overview Overwolf Library.
* @name Overwolf Library.
* @author 	Gil Or Gil@overwolf.com
* @version 	0.1 
*/
var Overwolf = new OverwolfObj();
/**
Creates a new Overwolf API Library class.
@class Represents Overwolf API
*/
function OverwolfObj() {

    var frameName = null;
    /** 
    * Initializes OverwolfAPI and connects to the app events.
    * @param {string} frameName (Optional) - A frame name to send api callbacks and event to
    */
    this.Connect = function (_frameName) {
        if (typeof (OverwolfAPI) === "undefined") {
            throw new Error("Unable to initialize Overwolf API");
        }

        if (_frameName !== undefined) {
            frameName = _frameName;
        }
        else {
            frameName = "";
        }

        OverwolfAPI.Windows_RegisterOnWindowRectChanged(frameName, "OnWindowRectChanged");
        OverwolfAPI.Windows_GetWindowRect(frameName, "OnWindowRectChanged");

        OverwolfAPI.Windows_RegisterOnWindowIsShownChanged(frameName, "OnWindowIsShownChanged");
        OverwolfAPI.Windows_GetWindowIsShown(frameName, "OnWindowIsShownChanged");

        OverwolfAPI.Game_RegisterOnGameInfoChanged(frameName, "OnGameInfoChanged");
        OverwolfAPI.Game_GetInfo(frameName, "OnGameInfoChanged");

        OverwolfAPI.Game_RegisterOnResolutionChanged(frameName, "OnResolutionChanged");
        OverwolfAPI.Game_GetResolution(frameName, "OnResolutionChanged");


        // TODO: Register only specific
    };

    /**
    * Window represents the app window.
    * @static
    * @class
    */
    this.window = 
        {
            /** 
            * The screenX and screenY properties returns the x and y coordinates of the app relative to the screen or game window.
            * @type number
            * @Property
            */
            screenX: null,
            /** 
            * The screenX and screenY properties returns the x and y coordinates of the app relative to the screen or game window.
            * @type number
            * @Property
            */
            screenY: null,
            /** 
            * The outerWidth property returns the outer width of the app, including its border.
            * @type number
            * @Property
            */
            outerWidth: null,
            /** 
            * The outerHeight property returns the outer height of the app, including its border.
            * @type number
            * @Property
            */
            outerHeight: null,
            /** 
            * The isShown property returns wheter the app is currently visible to the user.
            * @type boolean
            * @Property
            */
            isShown: null,

        /**
        * Moves the app left and top edges to the specified coordinates. 
        * @param {number} x X coordinated
        * @param {number} y Y coordinated
        * @returns none
        */
        moveTo: function (x, y) {
            OverwolfAPI.Windows_SetWindowRect(x, y, 0, 0, true, false);
        },
        /**
        * Resizes the app to the specified width and height.
        * @param {number} x X coordinated
        * @param {number} y Y coordinated
        * @returns none
        */
        resizeTo: function (width, height) {
            OverwolfAPI.Windows_SetWindowRect(0, 0, width, height, false, true);
        },

        /**
        * Occurs when the size of the app has changed.
        * @event
        */
        onResize: null,
        /**
        * Occurs when the location of the app has changed.
        * @event
        */
        onLocationChange: null,
        /**
        * Occurs when the visibility of the app has changed.
        * @event
        */
        onShownChange: null
    };

    /**
    * Games represents overwolf games related information.
    * @static
    * @class
    */
    this.games = {
        /** 
        * The isGameInFocus property indicates whether the game is in focus. When a game is in focus Overwolf can interact with the game.
        * @Property
        */
        isGameInFocus: null,
        /** 
        * The isGameRunning property indicates if a supported game is currently running, not necessarily that the game is in focus and overlayed by Overwolf.
        * @Property
        */
        isGameRunning: null,
        /** 
        * The runningGameTitle property returns the current running game title.
        * @Property
        */
        runningGameTitle: null,
        /** 
        * The runningGameTitle property returns the Overwolf game ID of the current running game.
        * @Property
        */
        runningGameId: null,
        /** 
        * The gameWidth property returns the current running game width.
        * @Property
        */
        gameWidth: null,
        /** 
        * The gameWidth property returns the current running game height.
        * @Property
        */
        gameHeight: null,

        /**
        * Occurs when the games gets focus or not. When the game is in focus Overwolf can interact with it. happens whenever the user hit alt+tab or minimize/restores the game.
        * @event
        */
        onGameInFocusChanged: null,
        /**
        * Occurs when the current running game has changed, happens only when launching the game.
        * @event
        */
        onRunningGameChanged: null,
        /**
        * Occurs when the current running game resolution has changed.
        * @event
        */
        onGameResolutionChanged: null
    };

    /**
    * Media represents overwolf media elemnts, like screen capture, video recording features and social network integration.
    * @static
    * @class
    */
    this.media = {
        /** 
        * The lastScreenshotUrl property returns the last screenshot jpeg photo url.
        * @Property
        */
        lastScreenshotUrl: null,
        /** 
        * The lastScreenshotSuccessStatus property returns whether the last screenshot was successful.
        * @Property
        */
        lastScreenshotSucceded: null,

        /**
        * Takes a screenshot of the current game screen or desktop. Note that you should register onScreenshotTaken event before.
        */
        takeScreenshot: function () {
            OverwolfAPI.Content_TakeScreenshot(this.frameName, 'screenshotTaken');
        },
        /**
        * Opens the social network sharing console to allow the user to share a picture.
        * @param {image} image a url or image object to be shared. 
        * @param {description} description to be used when posting to social networks.
        */
        shareImage: function (image, description) {
            if (typeof (image) === "string") {
                shareImageUrlAsync(image, description);
            }
        },
        /**
        * Occurs when a screenshot has been taken by Overwolf, triggred by the takeScreenshot method.
        * @event
        */
        onScreenshotTaken: null
    };
}

function shareImageUrlAsync(url, description) {
    var img = new Image();
    img.onload = function () {
        shareImage(img, description);
    };
    img.src = url;
}

function shareImage(image, description) {
    var canvasCopy = document.createElement("canvas");
    var copyContext = canvasCopy.getContext("2d");

    canvasCopy.width = image.width;
    canvasCopy.height = image.height;
    copyContext.drawImage(image, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvasCopy.width, canvasCopy.height);

    shareCanvas(canvasCopy, description);
}

function shareCanvas(canvas, description) {
    var imageData = canvas.toDataURL('image/png');

    OverwolfAPI.Content_ShareImage(description, imageData);
}

function OnWindowRectChanged(left, top, width, height) {
    var invoke_onResize = false;
    var invoke_onLocationChange = false;

    if (Overwolf.window.outerWidth != width ||
        Overwolf.window.outerHeight != height) {
        invoke_onResize = true;
    }

    if (Overwolf.window.screenX != left ||
        Overwolf.window.screenY != top) {
        invoke_onLocationChange = true;
    }

    Overwolf.window.outerWidth = width;
    Overwolf.window.outerHeight = height;
    Overwolf.window.screenX = left;
    Overwolf.window.screenY = top;

    if (invoke_onLocationChange && Overwolf.window.onLocationChange != null && Overwolf.window.onLocationChange != undefined) {
        Overwolf.window.onLocationChange();
    }

    if (invoke_onResize && Overwolf.window.onResize != null && Overwolf.window.onResize != undefined) {
        Overwolf.window.onResize();
    }
}

function OnWindowIsShownChanged(isShown) {
    Overwolf.window.isShown = isShown;

    if (Overwolf.window.onShownChange != null && Overwolf.window.onShownChange != undefined) {
        Overwolf.window.onShownChange();
    }
}

function OnGameInfoChanged(isInGame, isGameRunning, gameTitle, gameId) {
    var invoke_onGameInFocusChanged = false;
    var invoke_onRunningGameChanged = false;

    if (Overwolf.games.isGameInFocus != isInGame) {
        invoke_onGameInFocusChanged = true;
    }

    if (Overwolf.games.isGameRunning != isGameRunning
        || Overwolf.games.runningGameTitle != gameTitle
        || Overwolf.games.runningGameId != gameId) {
        invoke_onRunningGameChanged = true;
    }

    Overwolf.games.isGameInFocus = isInGame;
    Overwolf.games.isGameRunning = isGameRunning;
    Overwolf.games.runningGameTitle = gameTitle;
    Overwolf.games.runningGameId = gameId;

    if (invoke_onGameInFocusChanged && Overwolf.games.onGameInFocusChanged != null && Overwolf.games.onGameInFocusChanged != undefined) {
        // Invoke:
        Overwolf.games.onGameInFocusChanged();
    }

    if (invoke_onRunningGameChanged && Overwolf.games.onRunningGameChanged != null && Overwolf.games.onRunningGameChanged != undefined) {
        // Invoke:
        Overwolf.games.onRunningGameChanged();
    }
}

function OnResolutionChanged(desktopWidth, desktopHeight, gameWidth, gameHeight, inGame) {
    Overwolf.games.gameWidth = gameWidth;
    Overwolf.games.gameHeight = gameHeight;
    Overwolf.games.isInGame = inGame;
    if (Overwolf.games.onGameResolutionChanged != null && Overwolf.games.onGameResolutionChanged != undefined) {
        Overwolf.games.onGameResolutionChanged();
    }
}

function screenshotTaken(screenshotLink, success) {
    Overwolf.media.lastScreenshotSucceded = success;
    Overwolf.media.lastScreenshotUrl = screenshotLink;
    if (Overwolf.media.onScreenshotTaken != null && Overwolf.media.onScreenshotTaken != undefined) {
        Overwolf.media.onScreenshotTaken();
    }
}