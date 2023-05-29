const { DOMParser } = require('xmldom');

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
        this._elasticValue = new Settings().elasticValue;
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

    /**
     * 檢查傳入的文字有沒有超出限制，如果超出限制會以標點符號分割字串
     */
    _checkTextLength(text) {
        let limit = this._textLimit;
        let result = [];
        const textLength = text.length;
        let mergeStartPosition = 0;
        let splitPosition = limit;
        const punctuation = ['。', '！', '!', '？', '?', '\n', '\t', '，', ',', '、', '　', ' ', '（', '）', '(', ')', '「', '」', '；', '﹔'];

        let reservedLenth = 0;
        while (splitPosition < textLength) {
            reservedLenth = this._countReservedWord(text.slice(mergeStartPosition, splitPosition));
            if (reservedLenth >= limit) {
                throw new Error("Use too much reserved word.")
            }
            splitPosition -= reservedLenth

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

            splitPosition += limit;
        }

        if (this._countReservedWord(text.slice(mergeStartPosition)) > this._elasticValue) { // elasticValue = 200
            throw new Error("Use too much reserved word.")
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

    /**
     * @param {object} element 套件解析後的element node
     * @param {number} layer 第幾層的節點(default layer = 1)
     */
    _getSsmlAllTags(element, layer = 1) {
        let ssmlTags = [];
        let tag = element.tagName;
        let attrib = {};
        let text = "";

        // 如果有element有childNodes，且數量大於等於1個
        if (element.childNodes && element.childNodes.length >= 1) {
            if ((element.childNodes[0].nodeType === element.TEXT_NODE) && (element.childNodes[0].data !== undefined)) {
                text = element.childNodes[0].data;
            }
        }

        if (element.attributes) {
            for (let i = 0; i < element.attributes.length; i++) {
                // 也可以用element.getAttribute()，但需要知道標籤名稱
                attrib[element.attributes[i].name] = element.attributes[i].value;
            }
        }

        ssmlTags.push({ "layer": layer, "tag": tag, "attrib": attrib, "text": text });

        if (element.childNodes) {
            for (let i = 0; i < element.childNodes.length; i++) {
                if (element.childNodes[i].nodeType === element.TEXT_NODE) {
                    if (element.childNodes[i].data !== undefined) {
                        if (i !== 0) {
                            ssmlTags.push({ "layer": layer, "tag": "tail", "attrib": null, "text": element.childNodes[i].data });
                        }
                    }
                } else if (element.childNodes[i].nodeType === element.ELEMENT_NODE) {
                    ssmlTags.splice(ssmlTags.length, 0, ...this._getSsmlAllTags(element.childNodes[i], layer + 1));
                } else {
                    console.log("Ignore part.");
                }
            }
        }
        return ssmlTags;
    }

    _ssmlTagToText(ssmlTag) {
        if (ssmlTag.tag === "voice") {
            return ssmlTag.text;
        } else if (ssmlTag.tag === "phoneme") {
            return this._addPhoneme(ssmlTag.text, ssmlTag.attrib.ph);
        } else if (ssmlTag.tag === "break") {
            return this._addBreak(parseInt(ssmlTag.attrib.time.slice(0, ssmlTag.attrib.time.length - 2)))
        } else if (ssmlTag.tag === "prosody") {
            return this._addProsody(ssmlTag.text, parseFloat(ssmlTag.attrib.rate.slice(0, ssmlTag.attrib.rate.length - 2)), parseInt(ssmlTag.attrib.pitch.slice(0, ssmlTag.attrib.pitch.length - 2)), parseFloat(ssmlTag.attrib.volume.slice(0, ssmlTag.attrib.volume.length - 2)));
        } else if (ssmlTag.tag === "tail") {
            return ssmlTag.text;
        } else {
            return "";
        }
    }

    _formatSsmlText(ssml_element) {
        const limit = this._textLimit;

        let ssmlTagList = this._getSsmlAllTags(ssml_element, 1);
        let textList = [""];

        let count = 0;
        let length = 0;
        let i = 0;
        let isProsody = false;
        let prosodyLayer = 1;
        let prosodyTagInfo = "";

        let ssmlTagListAfterCheckLength = [];
        for (let tag of ssmlTagList) {
            let textParagraphList = this._checkTextLength(tag.text);

            for (let text of textParagraphList) {
                ssmlTagListAfterCheckLength.push({ "layer": tag['layer'], "tag": tag['tag'], "attrib": tag['attrib'], "text": this._checkReservedWord(text._text) });
            }
        }

        for (i = 0; i < (ssmlTagListAfterCheckLength.length - 1); i++) {
            let ssmlText = this._ssmlTagToText(ssmlTagListAfterCheckLength[i]);
            if (ssmlTagListAfterCheckLength[i].tag === "prosody") {
                // 偵測到prosody tag，針對prosody情境處裡tag
                isProsody = true;

                prosodyLayer = ssmlTagListAfterCheckLength[i].layer;
                ssmlText = ssmlText.slice(0, ssmlText.lastIndexOf("</prosody")); // 移除 '</prosody>'
                prosodyTagInfo = ssmlText.slice(0, ssmlText.indexOf(">") + 1);
                // console.log("--> start", prosody_start_tag, ssml_text);
            }

            length = length + ssmlText.length;
            textList[count] = textList[count] + ssmlText;

            if (isProsody === true) {
                if (ssmlTagListAfterCheckLength[i + 1].layer <= prosodyLayer) {
                    if ((ssmlTagListAfterCheckLength[i + 1].layer === prosodyLayer) && (ssmlTagListAfterCheckLength[i + 1].tag === "tail")) {
                        // console.log("Do nothing.");
                    } else {
                        // 偵測prosody tag結尾
                        isProsody = false;
                        prosodyTagInfo = "";
                        // console.log("--> add end tad </prosody>");
                        length = length + "</prosody>".length;
                        textList[count] = textList[count] + "</prosody>";
                    }
                }
            }

            if ((length + this._ssmlTagToText(ssmlTagListAfterCheckLength[i + 1]) > limit)) {
                // Add new text element
                textList.push("");
                count = count + 1;
                length = 0;

                // Add prosody end tag to previous text
                if (isProsody === true) {
                    textList[count - 1] = textList[count - 1] + "</prosody>";
                    textList[count] = textList[count] + prosodyTagInfo; // Add prosody header tag
                }
                // ========================================
            }
        }

        let endSymbol = "";
        if (isProsody === true) {
            endSymbol = "</prosody>";
        }

        let lastText = this._ssmlTagToText(ssmlTagListAfterCheckLength[i]);
        if ((length + lastText.length) > limit) {
            textList[count] = textList[count] + endSymbol;
            textList.push((prosodyTagInfo + lastText + endSymbol));
        } else {
            textList[count] = textList[count] + lastText + endSymbol;
        }

        console.log(textList);
        return textList;
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

    /**
     * 輸入的參數，若超過範圍值，皆以最大/最小值替代
     * @param {string} text 加入的文字
     * @param {number} rate 調整語速, 最小值=0.8, 最大值=1.2
     * @param {number} pitch 調整音調, 最小值=-2, 最大值=2
     * @param {number} volume 調整音量, 最小值=-6, 最大值=6
     * @param {number} position 文字加入的位置，position = -1 或大於段落總數時會加在最後
     */
    addWebpageText(text, rate = 1.0, pitch = 0, volume = 0.0, position = -1) {
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

        if (position === -1) {
            position = this.text.length + 1;
        }

        const textList = this._checkTextLength(text);

        const limit = this._textLimit;
        let count = 0;
        for (let textEach of textList) {
            textEach.update(this._checkReservedWord(textEach._text));

            let tags = [...textEach._text.matchAll(/\[:([\s\S]*?)\]/g)];
            let length = textEach._length;

            for (let tag of tags) {
                let tagStart = tag.index;
                let tagEnd = tagStart + (tag[0].length);

                if (textEach._text[tagEnd - 2] === "秒") {
                    length += 15; // ssml break tag 長度最大為22 比原本多15
                } else {
                    if (textEach._text[tag.index - 1] === "]") { // XXX workaround 判斷機制能再改
                        continue;
                    }
                    length += 51; // ssml break tag 長度最大(單一文字)為58 比原本多51
                }

                if (length > limit) {
                    textList.splice(count + 1, 0, new TextParagraph(textEach._text.slice(tagEnd)));
                    textList[count].update(textEach._text.slice(0, tagEnd));
                    textEach._text = textEach._text.slice(0, tagEnd);
                    break;
                }
            }

            // rematch
            let shift = 0;
            let new_tag = "";
            let new_text = textEach._text;
            tags = [...textEach._text.matchAll(/\[:([\s\S]*?)\]/g)];

            for (let tag of tags) {
                let tagStart = tag.index;
                let tagEnd = tagStart + (tag[0].length);

                if (textEach._text[tagEnd - 2] === "秒") {
                    let break_time = parseFloat(textEach._text.slice(tagStart + 2, tagEnd - 2)) * 1000;
                    new_tag = this._addBreak(break_time);
                    new_text = new_text.slice(0, tagStart + shift) + new_tag + new_text.slice(tagEnd + shift);
                } else {
                    if (textEach._text[tag.index - 1] === "]") { // XXX workaround 判斷機制能再改
                        new_tag = "";
                        continue;
                    }
                    let word = textEach._text[tagStart - 1];
                    let ph = textEach._text.slice(tagStart + 2, tagEnd - 1);
                    new_tag = this._addPhoneme(word, ph);
                    new_text = new_text.slice(0, tagStart + shift - 1) + new_tag + new_text.slice(tagEnd + shift);
                    shift--;
                }
                shift += new_tag.length - tagEnd + tagStart;
            }
            textList[count].update(this._addProsody(new_text, rate, pitch, volume));
            count++;
        }
        this.text.splice(position, 0, ...textList);
    }

    addSsmlText(text, position = -1) {
        if (typeof (position) !== 'number') {
            throw new TypeError("Parameter 'position(int)' type error.");
        }
        if (typeof text !== 'string') {
            throw new TypeError("Parameter 'text(str)' type error.");
        }

        const parser = new DOMParser();
        let ssmlElementRoot;
        let ssmlText;
        try {
            ssmlElementRoot = parser.parseFromString(text, 'application/xml').documentElement;
            ssmlText = this._formatSsmlText(ssmlElementRoot);
        } catch (error) {
            throw new Error("Read ssml string fail.");
        }

        let textList = [];

        if (position === -1) {
            position = this.text.length + 1;
        }

        for (let text of ssmlText) {
            textList.push(new TextParagraph(text));
        }
        this.text.splice(position, 0, ...textList);
    }

    /**
     * 獲得文章清單
     */
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

        if (extension === ".ssml" || extension === ".xml") {
            this.addSsmlText(text, position);
        } else {
            this.addText(text, position);
        }
    }
}

module.exports = {
    TextEditor,
    TextParagraph
};