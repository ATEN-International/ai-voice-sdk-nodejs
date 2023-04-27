const Voice = require('./enums').Voice;

class Settings {
    constructor() {
        this.textLimit = 1500;
        this.supportFileType = [".txt"];
        this.eachTaskTextLimit = this.textLimit + 200;
        this.printLog = false;
    }
}

class ConverterConfig {
    constructor(token = "", serverUrl = 'https://www.aivoice.com.tw') {
        if (typeof token !== "string") {
            throw new TypeError("Parameter 'token(str)' type error.");
        }
        this._token = token;
        this.setServer(serverUrl);
        this.voice = null; // 聲音預設值為null
        this._ssmlVersion = "1.0.demo";
        this._ssmlLang = "zh-TW";
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
            throw new TypeError("Parameter 'server_url(str)' type error.");
        }
        if (serverUrl.indexOf("http") === 0) {
            this._serverUrl = serverUrl;
        } else {
            throw new TypeError("Please check url, it should be with 'http' or 'https'.");
        }
    }

    getServer() {
        return this._serverUrl;
    }

    setVoice(voice = Voice.NOETIC) {
        if (!(voice instanceof Voice)) {
            throw new TypeError("Parameter 'voice(Voice)' type error.");
        }
        this.voice = voice;
    }

    getVoice() {
        return this.voice;
    }

    getSsmlVersion() {
        return this._ssmlVersion;
    }

    getSsmlLang() {
        return this._ssmlLang;
    }
}

module.exports = {
    ConverterConfig,
    Settings,
};
