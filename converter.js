const { Voice: Voice, ConverterStatus: ConverterStatus } = require('./enums');
const { RestfulApiHandler: RestfulApiHandler, Tools: Tools } = require('./units');
const { ConverterConfig: ConverterConfig, Settings: Settings } = require('./config');
const TextEditor = require('./textedit').TextEditor;

const statusAndErrorCodes = {
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

/**
 * @param {ConverterStatus} status 轉換器的狀態
 * @param {Object} data [{"id": (int)task_id, "data": (byte)auido_data}]
 * @param {string} detail
 * @param {string} errorMsg
 */
class ConverterResult {
    constructor(status, data, detail, errorMsg) {
        this.status = status;
        this.taskData = data;
        this.detail = detail;
        this.errorMessage = errorMsg;
    }

    /**
     * @param {String} filename 檔案名稱，預設為("aivoice")
     * @param {Boolean} isMerge 如果音檔數量超過一個，是否將其合併為一個檔案
     */
    async save(filename = "aivoice", isMerge = false) {
        let task_list_length = this.taskData.length;
        if (task_list_length > 0) {
            if (isMerge === true && task_list_length > 1) {
                let audioData = []
                for (let each_data of this.taskData) {
                    if (each_data.data === null) {
                        throw new Error("No audio data.");
                    }
                    audioData.push(each_data.data);
                }
                await new Tools().mergeWavFile(filename, audioData);
            } else {
                let count = 1;
                for (let each_data of this.taskData) {
                    if (each_data.data === null) {
                        throw new Error("No audio data.");
                    }

                    let file_number = "-" + count;
                    if (task_list_length === 1) {
                        file_number = "";
                    }

                    await new Tools().saveWavFile(filename + file_number, each_data.data);
                    count++;
                }
            }
        }
    }
}

/**
 * @param {ConverterConfig} config 轉換器設定檔
 */
class VoiceConverter {
    constructor(config = ConverterConfig()) {
        this._text = [];
        this._taskList = [];
        this._taskEachTextLimit = new Settings().eachTaskTextLimit;

        this.config = Object.assign(new ConverterConfig(), config);
        this._apiHandler = new RestfulApiHandler(this.config);
        this.text = new TextEditor(this._text, this.config, this._updateConfigValue.bind(this));
    }

    _translateResultCode(resultJson) {
        const code = resultJson['code'];
        if (code in statusAndErrorCodes) {
            return statusAndErrorCodes[code];
        } else {
            return resultJson['data'];
        }
    }

    _createTaskList() {
        this._taskList.length = 0;

        let length = 0
        let count = 0
        let i = 0;
        // this._taskList.splice(0,{"id": "", "text": ""});
        this._taskList.push({ "id": "", "text": "" });
        for (i = 0; i < this._text.length - 1; i++) {
            length += this._text[i]._length;
            this._taskList[count]["text"] += this._text[i]._text;
            if (length + this._text[i + 1]._length > this._taskEachTextLimit) {
                // console.log(`over limit in ${i} | ${this._text[i]._text} | ${length}`);
                this._taskList.push({ id: "", text: "" });
                count += 1;
                length = 0;
            }
        }

        // console.log(`---> ${i} <---`);

        // if (this._text.length > 1) {
        //   i += 1;
        // }
        if (length + this._text[i]._length > this._taskEachTextLimit) {
            this._taskList.push({ id: "", text: this._text[i]._text });
        } else {
            this._taskList[count]["text"] += this._text[i]._text;
        }
    }

    _voiceValueToName(voiceValue) {
        for (let vo in Voice) {
            if (Voice[vo] === voiceValue) {
                return Voice[vo];
            }
        }
    }

    _updateConfigValue(value) {
        // For text editor update converter config
        if (this.config.getVoice() === null) {
            this.config.setVoice(this._voiceValueToName(value.config_voice));
        }
    }

    /**
     * @param {ConverterConfig} config 轉換器設定檔
     */
    updateConfig(config = ConverterConfig()) {
        if (config.voice === undefined) {
            throw new TypeError("Parameter 'config(ConverterConfig)' type error.");
        }
        this.config.setToken(config.getToken());
        this.config.setServer(config.getServer());
        this.config.setVoice(config.getVoice());
    }

    getTaskList() {
        let result = [];
        if (this._taskList.length < 1) {
            console.log("Task list is empty.");
            return result;
        }

        for (let task of this._taskList) {
            result.push({ id: task.id, text: task.text });
        }
        return result;
    }

    /**
     * @param {string} intervalTime：當伺服器繁忙時，重試合成任務之間的間隔時間，最小值=0（不重試），最大值=10
     * @param {string} isWaitSpeech：是否等待語音合成完成，True=執行後會等待語音合成結束，結果與（func）get_speech相同
     */
    async run(intervalTime = 0, isWaitSpeech = false) {
        if (typeof intervalTime !== "number") {
            throw new TypeError("Parameter 'intervalTime' type error.");
        }
        if (intervalTime < 0 || intervalTime > 10) {
            throw new ValueError("Parameter 'intervalTime' value error.");
        }

        if (this._text.length < 1) {
            throw new Error("Text is empty.");
        }

        this._createTaskList();

        let status = ConverterStatus.ConverterStartUp;
        let taskData = [];
        let detail = "";
        let errorMsg = "";

        const taskNumber = this._taskList.length;
        let taskCount = 1;
        let resultJson = {};
        for (let task of this._taskList) {
            resultJson = { "data": "task start", "code": 50301 };
            while (resultJson['code'] === 50301) {
                console.log(`Waitting for server...`);

                resultJson = await this._apiHandler.addSsmlTask(task.text);

                if (intervalTime === 0 || resultJson['code'] === 20001) {
                    break;
                }

                await new Promise((resolve) => setTimeout(resolve, intervalTime * 1000));
                // ConverVoiceRunning
            }

            if (resultJson['code'] === 20001) {
                task.id = resultJson['data']['task_id'];
                if (Settings.print_log) {
                    console.log(`[INFO] Task start, task id: '${task.id}'`);
                }

                status = ConverterStatus.ConverVoiceStart;
                detail = `Start Convert: (${taskCount}/${taskNumber})`;
                taskData.push({ id: task.id, data: null });
            } else {
                status = ConverterStatus.ConverVoiceFail;
                if (resultJson['code'] === 50301) {
                    status = ConverterStatus.ServerBusy;
                }
                errorMsg = `${this._translateResultCode(resultJson)}`;
                break;
            }

            if (isWaitSpeech) {
                let taskStatus = "RUNNING";
                while (taskStatus === "RUNNING") {
                    resultJson = await this._apiHandler.getTaskStatus(task.id);
                    taskStatus = resultJson['data']['status'];
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    // ConverVoiceRunning
                }

                if (resultJson['code'] === 20001) {
                    status = ConverterStatus.ConverVoiceCompleted;
                } else {
                    status = ConverterStatus.ConverVoiceFail;
                    errorMsg = `${this._translateResultCode(resultJson)} (In process ${taskCount}/${taskNumber})`;
                    break;
                }
            }

            taskCount++;
        }

        if (resultJson['code'] === 20001) {
            if (isWaitSpeech) {
                return await this.getSpeech();
            }
            return new ConverterResult(status, taskData, detail, errorMsg);
        }

        if (taskData.length === 0) {
            taskData.push({ id: "0", data: null });
        }

        // status = ConverterStatus.ConverVoiceFail
        return new ConverterResult(ConverterStatus.ConverVoiceFail, taskData, "", errorMsg);
    }

    async checkStatus() {
        if (this._taskList.length < 1) {
            throw new Error("Converter task list is empty, Please start convert first.");
        }

        let status = ConverterStatus.ConverterStartUp;
        let taskData = [];
        let detail = "";
        let errorMsg = "";

        const taskNumber = this._taskList.length;
        let taskCount = 1;
        for (let task of this._taskList) {
            const resultJson = await this._apiHandler.getTaskStatus(task.id);

            if (resultJson['code'] === 20001) {
                if (Settings.printLog) {
                    console.log(`[INFO] Task(${task["id"].slice(0, 8)}) convert status '${resultJson['data']['status'].toLowerCase()}'`);
                }

                if (resultJson['data']['status'] === "SUCCESS") {
                    status = ConverterStatus.ConverVoiceCompleted;
                } else if (resultJson['data']['status'] === "RUNNING") {
                    status = ConverterStatus.ConverVoiceRunning;
                    detail = `Voice Converting: Task(${taskCount}/${taskNumber})`;
                } else {
                    // 待確認
                    errorMsg = this._translateResultCode(resultJson);
                    status = ConverterStatus.ConverVoiceFail;
                }
            } else {
                errorMsg = this._translateResultCode(resultJson);
                status = ConverterStatus.ConverVoiceFail;
            }

            taskData.push({ id: task.id, data: null });
            taskCount += 1;
        }
        return new ConverterResult(status, taskData, detail, errorMsg);
    }

    async getSpeech() {
        if (this._taskList.length < 1) {
            throw new Error("Converter task list is empty, Please start convert first.");
        }

        let taskData = [];
        let errorMsg = "";
        for (let task of this._taskList) {
            const resultJson = await this._apiHandler.getTaskAudio(task.id);

            if (resultJson['code'] !== 20001) {
                errorMsg = this._translateResultCode(resultJson);
                taskData.push({ id: task.id, data: null });
                return new ConverterResult(ConverterStatus.GetSpeechFail, taskData, "", errorMsg)
            }

            taskData.push({ id: task.id, data: resultJson['data'] });
        }
        return new ConverterResult(ConverterStatus.GetSpeechSuccess, taskData, "", errorMsg)
    }
}

module.exports = {
    RestfulApiHandler,
    VoiceConverter,
    ConverterResult,
    Voice,
}