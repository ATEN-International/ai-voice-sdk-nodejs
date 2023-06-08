# 簡介
AI Voice是宏正自動科技的語音合成服務優聲學，使用本SDK是必須租用優聲學服務。租用服務請至`https://www.aivoice.com.tw`上留下聯絡資料。<br>
宏正優聲學，推出限量企業體驗版之語音合成服務，提供六個優質美聲，大量語音合成，歡迎企業用戶填寫表格連繫, 了解更多企業體驗版方案細節!
<br><br>

# 目錄
- [簡介](#簡介)
- [事前準備](#事前準備)
- [AI Vioce SDK 範例](#ai-vioce-sdk-範例)
    - [語音清單](#目前提供多位聲優)
    - [建立轉換器](#建立轉換器)
    - [更新轉換器設定 (Optional)](#更新轉換器設定-optional)
    - [加入文章](#加入文章)
    - [獲得/顯示文章](#獲得顯示文章)
    - [刪除文章內容](#刪除文章內容)
    - [合成語音](#合成語音)
    - [確認語音合成狀態](#確認語音合成狀態)
    - [取得語音合成資料](#取得語音合成資料)
    - [進階應用](#進階應用)

<br>

# 事前準備
1. 至語音合成網頁"啟動" `API Access Token`
2. 至語音合成網頁"複製" `API_ACCESS_TOKEN`

<br>

# AI Vioce SDK 範例

## 目前提供多位聲優：

| 語音 | 聲優 | SDK 參數 |
| :---: | :---: | :---: |
| 知性女聲 | 嘉妮 | `NOETIC` |
| 文學男聲 | 裕祥 | `LITERARY` |
| 陽光男聲 | 力晨 | `CHEERFUL` |
| 主持女聲 | 貝拉 | `HOST` |
| 活潑女聲 | 貝拉 | `VIVID` |
| 柔美女聲 | 貝拉 | `GRACEFUL` |

<br>

***

## 建立轉換器
- 以下為建立轉換器的流程：
    1. 代入token與伺服器位置，並建立轉換器設定檔
    2. 修改設定檔內選用的語音(預設參數為`null`，未設定語音參數將不會進行轉換)
    3. 代入設定檔並建立轉換器

```javascript
const aivoice = require('ai-voice-sdk');

async function main() {
    const token = 'API_ACCESS_TOKEN'; // 改為語音網頁上的 API_ACCESS_TOKEN
    const server = 'SERVER_URL'; // Aten Ai Voice API URL

    // 1.建立轉換器設定檔
    let config = new aivoice.ConverterConfig(token, server);

    // 2.選擇設定檔內選用的聲優
    config.voice = aivoice.Voice.LITERARY;

    // 3.建立轉換器
    const converter = new aivoice.VoiceConverter(config);
}

main();
```

<br>

***

## 更新轉換器設定 (Optional)
- 修改轉換器設定有2種方式
    1. 修改`VoiceConverter.config`設定
        - 設定`config.voice`參數的方式有兩種
    2. 建立新設定檔，並更新至`VoiceConverter`

```javascript
    const newToken = 'API_ACCESS_TOKEN'; // 改為語音網頁上的 API_ACCESS_TOKEN
    const newServer = 'SERVER_URL'; // Aten Ai Voice API URL

    // 1. 修改`VoiceConverter.config`設定
    // 1.1 修改config token設定
    converter.config.setToken(newToken);

    // 1.2 修改config server url設定
    converter.config.setServer(newServer);

    // 1.3.1 修改config voice設定
    converter.config.voice = aivoice.Voice.NOETIC;
    // 1.3.2 修改config voice設定
    converter.config.setVoice(aivoice.Voice.NOETIC);

    // 2. 建立新設定檔，並更新至`VoiceConverter`
    // 2.1 建立新設定檔
    newConfig = new aivoice.ConverterConfig(newToken, newServer);
    newConfig.voice = aivoice.Voice.NOETIC;

    // 2.2 更新至`VoiceConverter`
    converter.updateConfig(newConfig);
```

<br>

***

## 加入文章
1. 轉換器的文字以段落清單的形式儲存
2. 以下有兩種方式加入文章

方法1: 透過程式碼加入
- 支援文字格式：`純文字`、`SSML`、`宏正優聲學RTF`
- 注：若轉換器的`語音參數`為`null`，加入SSML格式的文字內容時，會將`語音參數`設為SSML格式中語音標籤的參數
```javascript
// 方法1: 透過程式碼加入

// 1.1 加入純文字
// 參數 (str)     text，要加入的文字內容
// 參數 (int) position，要加入的段落，預設(position = -1)為加入清單最後
converter.text.addText("歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。", -1);

// 1.2 加入SSML格式
// 參數 (str)     text，要加入的文字內容
// 參數 (int) position，要加入的段落，預設(position = -1)為加入清單最後
converter.text.addSsmlText(
    `<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0.demo" xml:lang="zh-TW">
    <voice name="Aurora_noetic">宏正自動科技的人工智慧語音合成技術，帶來超逼真
    <phoneme alphabet="bopomo" lang="TW" ph="ㄉㄜ˙">的</phoneme>
    合成語音
    <break time="300ms"/>
    ：自然、真實，讓您拉近與客戶的距離，提高滿意度，帶來轉換率。
    </voice></speak>`, -1
    );

// 1.3 加入宏正優聲學RTF格式
// 參數 (str)     text，要加入的文字內容
// 參數 (float)   rate，調整語速 (0.8 ~ 1.2)
// 參數 (int)    pitch，調整音調 (-2 ~ 2)
// 參數 (float) volume，調整音量 (-6.0 ~ 6.0)
// 參數 (int) position，要加入的段落，預設(position = -1)為加入清單最後
converter.text.addWebpageText(
    `按下合成鍵之前，我們[:ㄇㄣˊ]建議您先確認2個[:ㄍㄜ˙]問題：
    您的文章轉成語音之後，是好聽流暢的嗎？[:1.2秒]
    您有[:ㄧㄡˇ]將閱讀文，轉為聆聽文嗎？
    `, 1.01, 0, 2.45, -1
    );
```

<br>

方法2: 讀取文字檔加入
- 支援格式：`純文字檔(.txt)`、`SSML格式的檔案(.ssml/.xml)`
- 注：若轉換器的`語音參數`為`null`，加入SSML格式的文字內容時，會將`語音參數`設為SSML格式中語音標籤的參數
```javascript
// 方法2: 讀取文字檔加入
// 參數 (str) file_path，要加入的文字內容
// 參數 (str)    encode，編碼格式，預設為"utf-8"
// 參數 (int)  position，要加入的段落，預設(position = -1)為加入清單最後

// 2.1 讀取純文字檔加入
converter.text.openTextFile("textfile.txt", "utf-8", -1);

// 2.2 讀取SSML格式的檔案
converter.text.openTextFile("ssmlfile.ssml", "utf-8", -1);
```
<br>

***

## 獲得/顯示文章
- 文章以清單的形式儲存
```javascript
// 印出文章清單
console.log(`${converter.text.getText()}`);

// 印出文章
converter.text.show();
```

- Terminal:
```
歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。,歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。
,宏正自動科技的人工智慧語音合成技術,，帶來超逼真的合成語音：自然、真實，讓您拉近與客戶的距離，提高滿意度，帶來轉換率。
按下合成鍵之前，我們建議您先確認2個問題：
,您的文章轉成語音之後，是好聽流暢的嗎？
您有將閱讀文，轉為聆聽文嗎？
微調一下文章結構，參考合成使用說明，讓文章看起來像閱讀文,，也適合您的聆聽者。
有任何對我們的合成服務的建議，也請您不吝指教！
ATEN, 專注開發智慧製造及物聯網解決方案，堅持客戶優先的理念，也將持續實現承諾，提供客戶最佳的服務。

 0 : 歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。
 1 : 歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。
宏正自動科技的人工智慧語音合成技術，帶來超逼真的合成語音：自然、真實，讓您拉近與客戶的距離，提高滿意度，帶來轉換率。
按下合成鍵之前，我們建議您先確認2個問題：
您的文章轉成語音之後，是好聽流暢的嗎？
您有將閱讀文，轉為聆聽文嗎？
微調一下文章結構，參考合成使用說明，讓文章看起來像閱讀文，也適合您的聆聽者。
有任何對我們的合成服務的建議，也請您不吝指教！
ATEN 專注開發智慧製造及物聯網解決方案，堅持客戶優先的理念，也將持續實現承諾，提供客戶最佳的服務。
```
<br>

***


## 刪除文章內容
- 刪除文章內容有以下兩種方法

方法1: 刪除文章段落
```javascript
// 參數 (int) position，要刪除的段落
converter.text.deleteParagraph(0);
// 印出文章
converter.text.show();
```

- Terminal:
```
 0 : 歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。
宏正自動科技的人工智慧語音合成技術，帶來超逼真的合成語音：自然、真實，讓您拉近與客戶的距離，提高滿意度，帶來轉換率。
按下合成鍵之前，我們建議您先確認2個問題：
您的文章轉成語音之後，是好聽流暢的嗎？
您有將閱讀文，轉為聆聽文嗎？
微調一下文章結構，參考合成使用說明，讓文章看起來像閱讀文，也適合您的聆聽者。
有任何對我們的合成服務的建議，也請您不吝指教！
ATEN 專注開發智慧製造及物聯網解決方案，堅持客戶優先的理念，也將持續實現承諾，提供客戶最佳的服務。
```

<br>

方法2: 清空文章
```javascript
// 清除文章所有內容
converter.text.clear();
// 印出文章
converter.text.show();
```

- Terminal:
```
Text is empty.
```
<br>

***

## 合成語音
- 合成語音有兩種使用方法：
    - 注：合成語音後不會將既有的文章刪除

方法1: 執行後不等待語音合成
```javascript
// 方法1：執行後不等待語音合成

// 讀取SSML格式的檔案
converter.text.openTextFile("ssmlfile.ssml", "utf-8", -1);

// 參數 (int) interval_time，伺服器忙碌時，重試合成任務間隔時間，最小值=0 (不重試), 最大值=10
// 參數 (bool) is_wait_speech，是否等待語音合成完成，如果為True，執行後會等待語音合成結束，其Result與get_speech(func)相同
result = await converter.run(1, false);

if (result.status === aivoice.ConverterStatus.ConverVoiceStart) {
    console.log(`Start convert: : ${result.detail}`);
} else {
    if (result.status === aivoice.ConverterStatus.ConverVoiceFail) {
        console.log(`Error message: ${result.errorMessage}`);
    } else if (result.status === aivoice.ConverterStatus.ServerBusy) {
        console.log(`Error message: ${result.errorMessage}`);
    }
}

```

- Terminal:
```
Waitting for server...
Start convert: Start Convert: (1/1)
```

<br>

方法2: 執行後等待語音合成結束並將資料取回
```javascript
// 方法2：執行後等待語音合成結束並將資料取回

// 參數 (int) interval_time，伺服器忙碌時，重試合成任務間隔時間，最小值=0 (不重試), 最大值=10
// 參數 (bool) is_wait_speech，是否等待語音合成完成，如果為True，執行後會等待語音合成結束，其Result與get_speech(func)相同
result = await converter.run(1, true);

if (result.status === aivoice.ConverterStatus.GetSpeechSuccess) {
    console.log("Get speech data success.");
    // 將語音另存為"aivoice.wav"，且當語音數量超過一個時，將語音檔各別存為單一檔案
    result.save("aivoice", false);
} else {
    if (result.status === aivoice.ConverterStatus.GetSpeechFail) {
        console.log(`Error message: ${result.errorMessage}`);
    } else if (result.status === aivoice.ConverterStatus.ConverVoiceFail) {
        console.log(`Error message: ${result.errorMessage}`);
    } else {
        console.log(`Converter status: ${result.status.name}, Detail: ${result.detail}`);
    }
}
```

- Terminal:
```
Waitting for server...
Get speech data success.
```
<br>

***

## 確認語音合成狀態
- 需要先執行過`(function) run`，才能夠執行
```javascript
result = await converter.checkStatus();

if (result.status === aivoice.ConverterStatus.ConverVoiceCompleted) {
    console.log("Convert success.")
} else {
    if (result.status === aivoice.ConverterStatus.ConverVoiceRunning) {
        console.log(`Convert processing: ${result.detail}`)
    } else if (result.status === aivoice.ConverterStatus.ConverVoiceFail) {
        console.log(`Error message: ${result.errorMessage}`)
    }
}
```

- Terminal:
```
Convert success.
```
<br>

***

## 取得語音合成資料
- 注：需要先執行過`(function) run`，才能夠執行
```javascript
result = await converter.getSpeech();

if (result.status === aivoice.ConverterStatus.GetSpeechSuccess) {
    console.log("Get speech data success.");
    // 將語音另存為"aivoice.wav"，且當語音數量超過一個時，將語音檔合併至同一檔案
    result.save("aivoice", true);
} else if (result.status === aivoice.ConverterStatus.GetSpeechFail) {
    console.log(`Error message: ${result.errorMessage}`);
}
```

- Terminal:
```
Get speech data success.
```
<br>

***

## 進階應用
1. 插入停頓
2. 調整語速、音調、以及音量
3. 修改發音
4. 修改發音並且調整語速、音調、以及音量

<br>


### 插入停頓
```javascript
// 參數 (int) break_time，插入停頓時間(毫秒)
// 參數 (int)   position，要插入停頓的段落，預設(position = -1)為加入清單最後

// 在段落最後加入300毫秒的停頓
converter.text.insertBreak(300, -1);
```

<br>

### 調整語速、音調、以及音量
```javascript
// 參數 (str)     text，要調整的文字內容
// 參數 (float)   rate，調整語速 (0.8 ~ 1.2)
// 參數 (int)    pitch，調整音調 (-2 ~ 2)
// 參數 (float) volume，調整音量 (-6.0 ~ 6.0)
// 參數 (int) position，要插入的段落，預設(position = -1)為加入清單最後

// 在段落最後加入文字，並調整與速、音調、以及音量

converter.text.insertProsody("歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。", 1.2, 2, -3.3, -1);
```

<br>

### 修改發音
```javascript
// 參數 (str)     text，要修改發音的文字內容
// 參數 (str)       ph，修改後的發音
// 參數 (int) position，要插入的段落，預設(position = -1)為加入清單最後

// 在段落最後加入文字，並修改文字內容的發音
converter.text.insertPhoneme("大家好", "ㄧㄡ ㄕㄥ ㄒㄩㄝˊ", -1);
```

<br>

### 修改發音並且調整語速、音調、以及音量
```javascript
// 參數 (str)     text，要修改發音的文字內容
// 參數 (str)       ph，修改後的發音
// 參數 (float)   rate，調整語速 (0.8 ~ 1.2)
// 參數 (int)    pitch，調整音調 (-2 ~ 2)
// 參數 (float) volume，調整音量 (-6.0 ~ 6.0)
// 參數 (int) position，要插入的段落，預設(position = -1)為加入清單最後

// 在段落1，插入修改發音後的文字內容，並且調整與速、音調、以及音量
converter.text.insertProsodyAndPhoneme("優聲學", "ㄉㄚˋ ㄐㄧㄚ ㄏㄠˇ", 0.8, -2, 5.5, 1);
```

<br>

### 印出文章
```javascript
converter.text.show();
```

- Terminal:
```
 0 : <break time="300ms"/>
 1 : <prosody rate="0.8" pitch="-2st" volume="+5.5dB"><phoneme alphabet="bopomo" lang="TW" ph="ㄉㄚˋ ㄐㄧㄚ ㄏㄠˇ">優聲學</phoneme></prosody>
 2 : <prosody rate="1.2" pitch="+2st" volume="-3.3dB">歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。</prosody>
 3 : <phoneme alphabet="bopomo" lang="TW" ph="ㄧㄡ ㄕㄥ ㄒㄩㄝˊ">大家好</phoneme>
```

<br>
