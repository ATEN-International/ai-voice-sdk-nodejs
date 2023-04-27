# AI VOICE SDK

<br>

## 目錄
 - [簡介](#簡介)
 - [需求](#需求)
 - [開始使用](#開始使用)
<br><br>

## 簡介
AI Voice是宏正自動科技的語音合成服務優聲學，使用本SDK是必須租用優聲學服務。租用服務請至`https://www.aivoice.com.tw`上留下聯絡資料。<br>
宏正優聲學，推出限量企業體驗版之語音合成服務，提供六個優質美聲，大量語音合成，歡迎企業用戶填寫表格連繫, 了解更多企業體驗版方案細節!
<br><br>

## 需求
### Node.js
```
Node.js >= 18.0
```
<br>

### 支援版本
```
API == v1.x
```

<br><br>

## 開始使用

### 安裝
 - 透過`npm`安裝套件 (Comming soon)
<br><br>


****

## AI Vioce SDK 範例

### 事前準備
1. 至語音合成網頁"啟動" `API Access Token`
2. 至語音合成網頁"複製" `API_ACCESS_TOKEN`

<br>

### 目前提供多位聲優：

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

### 建立轉換器
- 以下為建立轉換器的流程：
    1. 代入token與伺服器位置，並建立轉換器設定檔
    2. 修改設定檔內選用的語音(預設參數為`null`，未設定語音參數將不會進行轉換)
    3. 代入設定檔並建立轉換器
    4. 調整轉換器語音 (Optional)
    5. 更新轉換器設定 (Optional)

```javascript
const aivoice = require('ai-voice-sdk');

async function main() {
    const token = 'API_ACCESS_TOKEN'; // 改為語音網頁上的 API_ACCESS_TOKEN
    const server = 'SERVER_URL'; // 需要有帶"https"

    // 1.建立轉換器設定檔
    let config = new aivoice.ConverterConfig(token, server);

    // 2.選擇設定檔內選用的聲優
    config.voice = aivoice.Voice.LITERARY;

    // 3.建立轉換器
    const converter = new aivoice.VoiceConverter(config);

    // 4.調整轉換器語音
    config.voice = aivoice.Voice.NOETIC;
    converter.updateConfig(config);

    // 5.更新轉換器設定
    let newConfig = new aivoice.ConverterConfig(token, server);
    newConfig.voice = aivoice.Voice.NOETIC;
    converter.updateConfig(newConfig);
}

main();
```

<br>

***

### 加入文章
1. 轉換器的文字以段落清單的形式儲存
2. 以下有兩種方式加入文章

方法1: 透過程式碼加入
```javascript
// converter.text.addText("123");
// 方法1: 透過程式碼加入
// 參數 (str)     text，要加入的文字內容
// 參數 (int) position，要加入的段落，預設為加入清單最後
converter.text.addText("歡迎體驗宏正優聲學，讓好聲音為您的應用提供加值服務。", -1);
```

<br>

方法2: 讀取文字檔加入
```javascript
// 方法2: 讀取文字檔加入
// 參數 (str) file_path，要加入的文字內容
// 參數 (str)    encode，編碼格式，預設為"utf-8"
converter.text.openTextFile("textfile.txt", "utf-8");

```
<br>

***

### 獲得/顯示文章
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


### 刪除文章內容
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

### 合成語音
- 合成語音有兩種使用方法：

方法1: 執行後不等待語音合成
```javascript
// 方法1：執行後不等待語音合成

// 參數 (int) interval_time，伺服器忙碌時，重試合成任務間隔時間，最小值=0 (不重試), 最大值=10
// 參數 (bool) is_wait_speech，是否等待語音合成完成，如果為True，執行後會等待語音合成結束，其Result與get_speech(func)相同
result = await converter.run(1, false);

if (result.status !== aivoice.ConverterStatus.ConverVoiceStart) {
    if (result.status === aivoice.ConverterStatus.ConverVoiceFail) {
        console.log(`"Error message: ${result.errorMessage}"`);
    }
}
```

- Terminal:
```
Waitting for server...
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
    // 將語音另存為"aivoice.wav"
    result.save("aivoice");
} else if (result.status === aivoice.ConverterStatus.GetSpeechFail) {
    console.log(`Error message: ${result.errorMessage}`);
} else {
    console.log(`Converter status: ${result.status.name}, Detail: ${result.detail}`);
}
```

- Terminal:
```
Waitting for server...
Get speech data success.
```
<br>

***

### 確認語音合成狀態
- 需要先執行過`(function) run`，才能夠執行
```javascript
result = await converter.checkStatus();

if (result.status === aivoice.ConverterStatus.ConverVoiceCompleted) {
    console.log("Convert success.")
} else {
    if (result.status === aivoice.ConverterStatus.ConverVoiceRunning) {
        console.log(`Convert processing: ${result.detail}`)
    }
    if (result.status === aivoice.ConverterStatus.ConverVoiceFail) {
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

### 取得語音合成資料
- 注：需要先執行過`(function) run`，才能夠執行
```javascript
result = await converter.getSpeech();

if (result.status === aivoice.ConverterStatus.GetSpeechSuccess) {
    console.log("Get speech data success.");
    // 將語音另存為"aivoice.wav"
    result.save("aivoice");
} else if (result.status === aivoice.ConverterStatus.GetSpeechFail) {
    console.log(`Error message: ${result.errorMessage}`);
} else {
    console.log(`Converter status: ${result.status.name}, Detail: ${result.detail}`);
}
```

- Terminal:
```
Get speech data success.
```
<br>

***


<br><br>

### 範例程式 (Comming soon)
<br><br>

### 更多範例 (Comming soon)
<br><br>