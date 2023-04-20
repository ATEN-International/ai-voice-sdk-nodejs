const axios = require('axios');
const fs = require('fs');

const Voice = require('./enums').Voice;
// const Settings = require('./config').Settings;
const { ConverterConfig: ConverterConfig, Settings: Settings } = require('./config');

class RestfulApiHandler {
    constructor(url, token) {
        this._serverUrl = url;
        this.voice = Voice.NOETIC;
        this._ssmlVersion = "1.0.demo";
        this._ssmlLang = "zh-TW";
        this._serverSupportJsonStatusCode = [200, 400, 500, 503]; // 401 server回傳會少帶code參數，所以暫時移除
        this.axios = axios;
        this.token = token
        this.config = {
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            }
        };
        this.configGetBinary = {
            responseType: 'arraybuffer',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            }
        };
    }

    _restfulSender(api_url, payload, getBinary = false) {
        let config = this.config;
        if (getBinary) {
            config = this.configGetBinary;
        }

        // Return Promise Object
        return this.axios.post(api_url, payload, config)
            .then(response => {
                return response
            })
            .catch(error => {
                throw error
            });
    }

    _responseErrorHandler(result) {
        /*
        處理非200的response，以及將不是json格式或缺少資訊的response格式化
        */
        if (result.status == 404) {
            return { "data": "Not Found", "code": result.status };
        } else if (result.status == 401) {
            return { "data": { "status": "Not authorized." }, "code": result.status };
        } else if (result.status == 200) {
            return { "data": "Unknown error. Can not get Restful API response, maybe 'server url' is wrong.", "code": 40499 };
        } else {
            if (result.message == "self-signed certificate") {
                return { "data": "Do not support self-signed certificate server.", "code": 40199 };
            } else {
                return { "data": result.data, "code": result.status };
            }
        }
    }

    _responseHandler(result) {
        // result 會有2種型態 AxiosError(裡面的response為'AxiosResponse') / AxiosResponse
        // return json格式
        if (result.status === 200) {
            // 處理 AxiosResponse
            if (result.headers["content-type"] === "application/json") {
                console.log("Success");
                return result.data;
            } else {
                console.log("Error in 200");
                return this._responseErrorHandler(result);
            }
        } else {
            // 處理 AxiosError
            if (typeof (result.response) !== "undefined") {
                if (this._serverSupportJsonStatusCode.includes(result.response.status)) {
                    console.log("Error in normal response,", result.response.status);
                    return result.response.data;
                } else {
                    return this._responseErrorHandler(result.response);
                }
            } else {
                console.log("Error before send,", result.message)
                return this._responseErrorHandler(result);
            }
        }
    }

    async addTextTask(text) {
        const apiPath = "/api/v1.0/syn/syn_text";
        const payload = {
            "orator_name": this.voice,
            "text": text
        };

        if (payload['text'].length > 2000) {
            return { "data": "字數超過限制值", "code": 40010 };
        }

        try {
            const result = await this._restfulSender((this._serverUrl + apiPath), payload);
            return this._responseHandler(result);
        } catch (error) {
            return this._responseHandler(error);
        }
    }

    async addSsmlTask(ssmlText) {
        const apiPath = "/api/v1.0/syn/syn_ssml";
        const payload = {
            "ssml": `<speak xmlns="http://www.w3.org/2001/10/synthesis" version=\
"${this._ssmlVersion}" xml:lang="${this._ssmlLang}"><voice name="${this.voice}">\
${ssmlText}\
</voice></speak>`
        };

        if (payload['ssml'].length > 2000) {
            return { "data": "字數超過限制值", "code": 40010 };
        }

        try {
            const result = await this._restfulSender((this._serverUrl + apiPath), payload);
            return this._responseHandler(result);
        } catch (error) {
            return this._responseHandler(error);
        }
    }

    async getTaskStatus(task_id) {
        const apiPath = "/api/v1.0/syn/task_status";
        const payload = {
            "task_id": task_id,
        };

        try {
            const result = await this._restfulSender((this._serverUrl + apiPath), payload);
            return this._responseHandler(result);
        } catch (error) {
            return this._responseHandler(error);
        }
    }

    async getTaskAudio(task_id) {
        const apiPath = "/api/v1.0/syn/get_file";
        const payload = {
            "filename": `${task_id}.wav`,
        };

        try {
            const result = await this._restfulSender((this._serverUrl + apiPath), payload, true);
            if (result.headers["content-type"] === "audio/wav") {
                return { "data": result.data, "code": 20001 };
            } else {
                return this._responseHandler(result);
            }
        } catch (error) {
            return this._responseHandler(error);
        }
    }

    updateConfig(config = ConverterConfig()) {
        this._serverUrl = config.serverUrl;
    }
}

class Tools {
    constructor() {
        this._supportFileType = Settings().supportFileType;
    }

    async saveWavFile(data, filename) {
        // const fs = require('fs');
        try {
            await fs.promises.writeFile(`${filename}.wav`, Buffer.from(data));
        } catch (error) {
            // console.error('Error saving audio file:', error);
            throw new Error(`Save wav file fail: ${error}`);
        }
    }
}

module.exports = {
    RestfulApiHandler,
    Tools,
};