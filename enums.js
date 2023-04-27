class Status {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

const Voice = {
    NOETIC: 'Aurora_noetic',
    LITERARY: 'Aaron_literary',
    CHEERFUL: 'Bill_cheerful',
    HOST: 'Bella_host',
    VIVID: 'Bella_vivid',
    GRACEFUL: 'Bella_graceful'
}

const ConverterStatus = {
    ConverterStartUp: new Status("ConverterStartUp", 0),
    ConverVoiceStart: new Status("ConverVoiceStart", 10),
    ConverVoiceRunning: new Status("ConverVoiceRunning", 11),
    ConverVoiceCompleted: new Status("ConverVoiceCompleted", 12),
    ConverVoiceFail: new Status("ConverVoiceFail", 13),
    ServerBusy: new Status("ServerBusy", 21),
    GetSpeechSuccess: new Status("GetSpeechSuccess", 91),
    GetSpeechFail: new Status("GetSpeechFail", 92)
}

module.exports = {
    Voice,
    ConverterStatus
}