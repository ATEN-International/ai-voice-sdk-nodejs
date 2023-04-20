const fs = require('fs');

const Settings = require('./config').Settings;

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
    Tools,
};