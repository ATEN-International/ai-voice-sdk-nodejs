const Voice = require('./enums').Voice;

class Settings {
    constructor() {
        this.textLimit = 1500;
        this.elasticValue = 200;
        this.supportFileType = [".txt"];
        this.eachTaskTextLimit = this.textLimit + this.elasticValue;
        this.printLog = false;
    }
}

class ConverterConfig {
    constructor(token = "", serverUrl = 'https://www.aivoice.com.tw') {
        if (typeof token !== "string") {
            throw new TypeError("Parameter 'token(str)' type error.");
        }
        if (typeof serverUrl !== "string") {
            throw new TypeError("Parameter 'server_url(str)' type error.");
        }
        if (serverUrl.indexOf("http") !== 0) {
            throw new TypeError("Please check url, it should be with 'http' or 'https'.");
        }

        this._token = token;
        this._serverUrl = "";
        this.setServer(serverUrl);
        this.voice = null; // 聲音預設值為null
        this._ssmlVersion = "1.0.demo";
        this._ssmlLang = "zh-TW";

        this.voiceValues = Object.values(Voice);
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

    setVoice(voice) {
        if (this.voiceValues.includes(voice) != true) {
            throw new TypeError("Parameter 'voice(Voice)' type or value error.");
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
