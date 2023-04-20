const Voice = require('./enums').Voice;

class Settings {
    constructor() {
        this.textLimit = 1500;
        this.supportFileType = [".txt"];
        this.eachTaskTextLimit = textLimit + 200;
        this.printLog = false;
    }
}

class ConverterConfig {
    constructor(token = "", serverUrl = 'https://www.aivoice.com.tw') {
        if (typeof token !== "string") {
            // throw new TypeError("參數 'token(str)' 型別錯誤。");
            throw new TypeError("Parameter 'token(str)' type error.");
        }
        this._token = token;
        this.setServer(serverUrl);
        this.voice = null; // 聲音預設值為null
        this._ssmlVersion = "";
        this._ssmlLang = "";
    }

    setToken(token = "") {
        if (typeof token !== "string") {
            throw new TypeError("Parameter 'token(str)' type error.");
        }
        this._token = token;
    }

    getToken() {
        return this._token;
    }

    setServer(serverUrl = "") {
        if (typeof serverUrl !== "string") {
            // throw new TypeError("參數 'serverUrl(str)' 型別錯誤。");
            throw new TypeError("Parameter 'server_url(str)' type error.");
        }
        if (serverUrl.indexOf("http") === 0) {
            this._serverUrl = serverUrl;
        } else {
            // throw new TypeError("請檢查網址，應該以 'http' 或 'https' 開頭。");
            throw new TypeError("Please check url, it should be with 'http' or 'https'.");
        }
    }

    getServer() {
        return this._serverUrl;
    }

    setVoice(voice = Voice.NOETIC) {
        if (!(voice instanceof Voice)) {
            // throw new TypeError("參數 'voice(Voice)' 型別錯誤。");
            throw new TypeError("Parameter 'voice(Voice)' type error.");
        }
        this.voice = voice;
    }

    getVoice() {
        return this.voice;
    }
}

module.exports = {
    ConverterConfig,
    Settings,
};
