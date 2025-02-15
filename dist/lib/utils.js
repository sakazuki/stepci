"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJSON = exports.parseEnvArray = exports.checkOptionalEnvArrayFormat = exports.checkEnvFormat = void 0;
// Check if env format matches the convention e.g. `variable=VARIABLE`
const checkEnvFormat = (str) => str.match(/^(\w+=.+)$/);
exports.checkEnvFormat = checkEnvFormat;
// Check if all optional env variables match the required format
const checkOptionalEnvArrayFormat = (envs) => envs?.length && !envs.every(exports.checkEnvFormat);
exports.checkOptionalEnvArrayFormat = checkOptionalEnvArrayFormat;
// Parse every entry in optional env array to a key value pair and return as object
function parseEnvArray(env) {
    const entries = env?.map((opt) => {
        const eq = opt.indexOf('=');
        const key = opt.substring(0, eq);
        const value = opt.substring(eq + 1);
        return [key, value];
    });
    return Object.fromEntries(entries ?? []);
}
exports.parseEnvArray = parseEnvArray;
function isJSON(input) {
    if (typeof input === 'object')
        return true;
    try {
        JSON.parse(input);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.isJSON = isJSON;
