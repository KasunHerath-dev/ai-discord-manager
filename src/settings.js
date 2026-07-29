import { SETTINGS_FILE } from "./config.js";
import { readJson, writeJson } from "./storage.js";
export const getSettings = () => readJson(SETTINGS_FILE, { initialized:false });
export const saveSettings = settings => writeJson(SETTINGS_FILE, settings);
