const axios = require('axios');
const fs = require('fs');

const { Voice:Voice, ConverterStatus:ConverterStatus } = require('./enums');
// 等同於 const voice = require('./enums').Voice;
//        +
//        const converterStatus = require('./enums').ConverterStatus;

const status_and_error_codes = {
    20001: '成功',
    40001: 'Request 必填參數不完整。',
    40002: 'SSML 格式錯誤。',
    40003: 'SSML <speak> 格式錯誤。',
    40004: 'SSML <voice> 格式錯誤。',
    40005: 'SSML <phoneme> 格式錯誤。',
    40006: 'SSML <break> 格式錯誤。',
    40007: 'SSML <prosody> 格式錯誤。',
    40008: 'orator name 不存在。',
    40009: 'text為空、僅有空白鍵或無合法字元。',
    40010: '字數超過限制值',
    50001: '合成器發生未知錯誤',
    50002: 'API/syn_ssml中，tag解析出來的合成文字為空字串或非法字元。',
    50301: '合成器忙碌中',
    50302: '找不到檔案，請確認音檔是否合成成功。',
    50303: '查無此task_id。',
    50304: '合成失敗，請重新發送請求。',
    401: 'token認證錯誤或API Access未開啟(Web page)。',
    404: '找不到資源, url 錯誤。',
    40199: 'Do not support self-signed certificate server.',
    40499: 'Unknown error. Can not get Restful API response, maybe "server url" is wrong.',
}

class RestfulApiHandler {
    constructor(url, token) {
        this._serverUrl = "SERVER_URL";
        this.voice = Voice.NOETIC;
        this._ssmlVersion = "1.0.demo";
        this._ssmlLang = "zh-TW";
        this._server_support_json_status_code = [200, 400, 500, 503]; // 401 server回傳會少帶code參數，所以暫時移除
        this.axios = axios;
        // this.token = token
        this.config = {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        };
        this.config2 = {
            responseType: 'arraybuffer',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        };
    }

    _restfulSender(api_url, payload, use2 = false) {
        let config = this.config;
        if (use2) {
            config = this.config2;
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
                if (this._server_support_json_status_code.includes(result.response.status)) {
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
            "orator_name": "Aurora_noetic",
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
}

class VoiceConverter {
    constructor() {
        this._sender = new RestfulApiHandler();
    }
}

module.exports = {
    RestfulApiHandler,
    VoiceConverter
}