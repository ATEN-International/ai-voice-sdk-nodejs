const Settings = require('./config').Settings;
const Tools = require('./units').Tools;

class TextParagraph {
    constructor(text) {
        this._text = text;
        this._length = text.length;
    }

    update(text) {
        this._text = text;
        this._length = text.length;
    }
}

class TextEditor {
    constructor(text = []) {
        this.text = text;
        this._textLimit = new Settings().textLimit;
        this._supportFileType = new Settings().supportFileType;
    }

    _checkReservedWord(text) {
        if (text.includes('"')) {
            text = text.replace(/"/g, "&quot;");
        }
        if (text.includes('&')) {
            text = text.replace(/&/g, "&amp;");
        }
        if (text.includes("'")) {
            text = text.replace(/'/g, "&apos;");
        }
        if (text.includes('<')) {
            text = text.replace(/</g, "&lt;");
        }
        if (text.includes('>')) {
            text = text.replace(/>/g, "&gt;");
        }
        return text;
    }

    _countReservedWord(text) {
        const reservedWordList = ['"', '&', "'", '<', '>']
        let count = 0;
        for (let keyWord of reservedWordList) {
            count += (text.match(new RegExp(keyWord, 'g')) || []).length;
        }
        return count * 6;
    }

    _checkTextLength(text) {
        /**
         * 檢查傳入的文字有沒有超出限制，如果超出限制會以標點符號分割字串
         */
        // let textLimit = 30;
        let result = [];
        const textLength = text.length;
        let mergeStartPosition = 0;
        let splitPosition = this._textLimit;
        // let splitPosition = textLimit;
        const punctuation = ['。', '！', '!', '？', '?', '\n', '\t', '，', ',', '、', '　', ' ', '（', '）', '(', ')', '「', '」', '；', '﹔'];

        while (splitPosition < textLength) {
            // 從分割點開始向前尋找標點符號
            for (let i = splitPosition - 1; i > mergeStartPosition; i--) {
                if (punctuation.includes(text[i])) {
                    splitPosition = i;
                    break;
                }
            }
            // 分段儲存文字
            result.push(new TextParagraph(text.slice(mergeStartPosition, splitPosition)));
            // 實際分割點(標點符號位置)設為新分割點
            mergeStartPosition = splitPosition;

            splitPosition += this._textLimit;
            // splitPosition += textLimit; // 改這
        }

        result.push(new TextParagraph(text.slice(mergeStartPosition)));
        return result;
    }

    /**
     * @param {string} text 加入的文字
     * @param {string} ph 指定的發音
     */
    _addPhoneme(text, ph) {
        const alphabet = "bopomo";
        const lang = "TW";
        return `<phoneme alphabet="${alphabet}" lang="${lang}" ph="${ph}">${text}</phoneme>`;
    }

    /**
     * 若輸入值大於上限值，以最大值替代
     * @param {number} breakTime 停頓的時間(最大值為5000，單位ms)
     */
    _addBreak(breakTime) {
        if (breakTime > 5000) {
            breakTime = 5000;
        }
        return `<break time="${breakTime}ms"/>`
    }

    /**
     * 輸入的參數，若超過範圍值，皆以最大/最小值替代
     * @param {string} text 加入的文字
     * @param {number} rate 調整語速, 最小值=0.8, 最大值=1.2
     * @param {number} pitch 調整音調, 最小值=-2, 最大值=2
     * @param {number} volume 調整音量, 最小值=-6, 最大值=6
     */
    _addProsody(text, rate, pitch, volume) {
        let tagRate = "";
        let tagPitch = "";
        let tagVolume = "";

        const rateMax = 1.2;
        const rateMin = 0.8;
        const rateDefault = 1.0;
        const pitchMax = 2;
        const pitchMin = -2;
        const pitchDefault = 0;
        const volumeMax = 6.0;
        const volumeMin = -6.0;
        const volumeDefault = 0.0;

        let isDefaultValue = true;

        if (typeof pitch !== "number") {
            // console.log("[DEBUG] Pitch type wrong");
            pitch = parseInt(pitch);
        }

        if (rate !== rateDefault) {
            isDefaultValue = false;
            if (rate > rateMax) {
                // console.log("[DEBUG] Rate out of range, use the maximum to translate.");
                tagRate = ` rate="${rateMax}"`;
            } else if (rate < rateMin) {
                // console.log("[DEBUG] Rate out of range, use the minimum to translate.");
                tagRate = ` rate="${rateMin}"`;
            } else {
                tagRate = ` rate="${rate}"`;
            }
        }

        if (pitch !== pitchDefault) {
            isDefaultValue = false;
            if (pitch > pitchMax) {
                // console.log("[DEBUG] Pitch out of range, use the maximum to translate.");
                tagPitch = ` pitch="+${pitchMax}st"`;
            } else if (pitch < pitchMin) {
                // console.log("[DEBUG] Pitch out of range, use the minimum to translate.");
                tagPitch = ` pitch="${pitchMin}st"`;
            } else {
                if (pitch > 0) {
                    tagPitch = ` pitch="+${pitch}st"`;
                } else {
                    tagPitch = ` pitch="${pitch}st"`;
                }
            }
        }

        if (volume !== volumeDefault) {
            isDefaultValue = false;
            if (volume > volumeMax) {
                // console.log("[DEBUG] Volume out of range, use the maximum to translate.");
                tagVolume = ` volume="+${volumeMax}dB"`;
            } else if (volume < volumeMin) {
                // console.log("[DEBUG] Volume out of range, use the minimum to translate.");
                tagVolume = ` volume="${volumeMin}dB"`;
            } else {
                if (volume > 0) {
                    tagVolume = ` volume="+${volume}dB"`;
                } else {
                    tagVolume = ` volume="${volume}dB"`;
                }
            }
        }

        if (isDefaultValue === true) {
            tagRate = ' rate="1.0"';
        }

        return `<prosody${tagRate}${tagPitch}${tagVolume}>${text}</prosody>`;
    }

    // ---------- Text ----------
    /**
     * @param {string} text 加入的文字
     * @param {number} position 文字加入的位置，position = -1 或大於段落總數時會加在最後
     */
    addText(text, position = -1) {
        if (typeof (position) !== 'number') {
            throw new TypeError("Parameter 'position(int)' type error.");
        }
        if (typeof text !== 'string') {
            throw new TypeError("Parameter 'text(str)' type error.");
        }

        const textList = this._checkTextLength(text);

        if (position === -1) {
            position = this.text.length + 1;
        }

        for (let textEach of textList) {
            textEach.update(this._checkReservedWord(textEach._text));
        }

        this.text.splice(position, 0, ...textList);
    }

    getText() {
        if (this.text.length < 1) {
            console.log("Text is empty.");
        }

        let result = [];
        for (let textEach of this.text) {
            result.push(textEach._text);
        }
        return result
    }

    /**
     * 顯示文章清單
     */
    show() {
        if (this.text.length < 1) {
            console.log("Text is empty.");
        }

        for (let i = 0; i < this.text.length; i++) {
            const paddedIndex = String(i).padStart(3, " ");
            console.log(`${paddedIndex}: ${this.text[i]._text}`);
        }
    }

    /**
     * @param {number} position 要刪除的段落
     */
    deleteParagraph(position) {
        if (typeof position !== 'number') {
            throw new TypeError("Parameter 'position(number)' type error.");
        }

        const textLength = this.text.length;
        if (textLength === 0) {
            console.log("Text is empty.");
            return true;
        }

        if (textLength < position) {
            throw new ValueError("Parameter 'position(number)' value more than number of sentences.");
        }

        this.text.splice(position, 1);
        return true;
    }

    /**
     * 清除文章所有內容
     */
    clear() {
        this.text.length = 0;
    }

    /**
     * @param {string} text 加入的文字
     * @param {string} ph 指定的發音
     * @param {number} position 文字加入的位置，position = -1 或大於段落總數時會加在最後
     */
    insertPhoneme(text, ph, position = -1) {
        if (typeof (position) !== 'number') {
            throw new TypeError("Parameter 'position(int)' type error.");
        }

        if (typeof text !== 'string') {
            throw new TypeError("Parameter 'text(str)' type error.");
        }

        if (typeof ph !== 'string') {
            throw new TypeError("Parameter 'text(str)' type error.");
        }

        const textList = this._checkTextLength(text);

        if (position === -1) {
            position = this.text.length + 1;
        }

        for (let textEach of textList) {
            textEach.update(this._addPhoneme(this._checkReservedWord(textEach._text), ph));
        }

        this.text.splice(position, 0, ...textList);
    }

    /**
     * 若輸入值大於上限值，以最大值替代
     * @param {number} breakTime 停頓的時間(最大值為5000，單位ms)
     * @param {number} position 文字加入的位置，position = -1 或大於段落總數時會加在最後
     */
    insertBreak(breakTime, position = -1) {
        if (typeof (position) !== 'number') {
            throw new TypeError("Parameter 'position(int)' type error.");
        }

        if (typeof (breakTime) !== 'number') {
            throw new TypeError("Parameter 'breakTime(int)' type error.");
        }

        if (position === -1) {
            position = this.text.length + 1;
        }

        this.text.splice(position, 0, new TextParagraph(this._addBreak(breakTime)));
    }

    /**
     * 輸入的參數，若超過範圍值，皆以最大/最小值替代
     * @param {string} text 加入的文字
     * @param {number} rate 調整語速, 最小值=0.8, 最大值=1.2
     * @param {number} pitch 調整音調, 最小值=-2, 最大值=2
     * @param {number} volume 調整音量, 最小值=-6, 最大值=6
     * @param {number} position 文字加入的位置，position = -1 或大於段落總數時會加在最後
     */
    insertProsody(text, rate = 1.0, pitch = 0, volume = 0.0, position = -1) {
        if (typeof position !== 'number') {
            throw new TypeError("Parameter 'position(int)' type error.");
        }

        if (typeof text !== 'string') {
            throw new TypeError("Parameter 'text(str)' type error.");
        }

        if (typeof rate !== 'number') {
            throw new TypeError("Parameter 'rate(float)' type error.");
        }

        if (typeof pitch !== 'number') {
            throw new TypeError("Parameter 'pitch(int)' type error.");
        }

        if (typeof volume !== 'number') {
            throw new TypeError("Parameter 'volume(float)' type error.");
        }

        const textList = this._checkTextLength(text);

        if (position === -1) {
            position = this.text.length + 1;
        }

        for (let textEach of textList) {
            textEach.update(this._addProsody(this._checkReservedWord(textEach._text), rate, pitch, volume));
        }

        this.text.splice(position, 0, ...textList);
    }

    /**
     * 輸入的參數，若超過範圍值，皆以最大/最小值替代
     * @param {string} text 加入的文字
     * @param {string} ph 指定的發音
     * @param {number} rate 調整語速, 最小值=0.8, 最大值=1.2
     * @param {number} pitch 調整音調, 最小值=-2, 最大值=2
     * @param {number} volume 調整音量, 最小值=-6, 最大值=6
     * @param {number} position 文字加入的位置，position = -1 或大於段落總數時會加在最後
     */
    insertProsodyAndPhoneme(text, ph, rate = 1.0, pitch = 0, volume = 0.0, position = -1) {
        if (typeof position !== 'number') {
            throw new TypeError("Parameter 'position(int)' type error.");
        }

        if (typeof text !== 'string') {
            throw new TypeError("Parameter 'text(str)' type error.");
        }

        if (typeof ph !== 'string') {
            throw new TypeError("Parameter 'text(str)' type error.");
        }

        if (typeof rate !== 'number') {
            throw new TypeError("Parameter 'rate(float)' type error.");
        }

        if (typeof pitch !== 'number') {
            throw new TypeError("Parameter 'pitch(int)' type error.");
        }

        if (typeof volume !== 'number') {
            throw new TypeError("Parameter 'volume(float)' type error.");
        }

        const textList = this._checkTextLength(text);

        if (position === -1) {
            position = this.text.length + 1;
        }

        for (let textEach of textList) {
            textEach.update(this._addProsody(this._addPhoneme(this._checkReservedWord(textEach._text), ph), rate, pitch, volume));
        }

        this.text.splice(position, 0, ...textList);
    }

    /**
     * @param {string} filePath 檔案路徑
     * @param {string} encode 編碼格式，預設為"utf-8"
     * @param {number} position 文字加入的位置，position = -1 或大於段落總數時會加在最後
     */
    openTextFile(filePath, encode = "utf-8", position = -1) {
        if (typeof position !== 'number') {
            throw new TypeError("Parameter 'position(int)' type error.");
        }

        const extension = filePath.substr(filePath.lastIndexOf('.'));

        if (this._supportFileType.includes(extension) === false) {
            throw new TypeError(`Not support ${extension} type.`);
        }

        let text = new Tools().openFile(filePath, encode);
        this.addText(text, position);
    }
}

module.exports = {
    TextEditor,
    TextParagraph
};