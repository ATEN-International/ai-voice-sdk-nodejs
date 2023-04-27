const { Voice: Voice, ConverterStatus: ConverterStatus } = require('./enums');
const { ConverterConfig: ConverterConfig, Settings: Settings } = require('./config');
const { VoiceConverter: VoiceConverter, ConverterResult: ConverterResult } = require('./converter');
const TextEditor = require('./textedit').TextEditor;

module.exports = {
    Voice,
    ConverterStatus,
    ConverterConfig,
    Settings,
    VoiceConverter,
    ConverterResult,
    TextEditor
}