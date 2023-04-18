const Voice = {
    NOETIC: 'Aurora_noetic',
    LITERARY: 'Aaron_literary',
    CHEERFUL: 'Bill_cheerful',
    HOST: 'Bella_host',
    VIVID: 'Bella_vivid',
    GRACEFUL: 'Bella_graceful'
}

const ConverterStatus = {
    ConverterStartUp: 0,
    ConverVoiceStart: 10,
    ConverVoiceRunning: 11,
    ConverVoiceCompleted: 12,
    ConverVoiceFail: 13,
    ServerBusy: 21,
    GetSpeechSuccess: 91,
    GetSpeechFail: 92
}

module.exports = {
    Voice,
    ConverterStatus
}