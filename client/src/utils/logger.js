const LEVELS = {
  OFF: 0,
  INFO: 1,
  DEBUG: 2,
};

const normalizeLevel = (value) => {
  const normalizedValue = (value || "").toString().toUpperCase();
  return LEVELS.hasOwnProperty(normalizedValue) ? LEVELS[normalizedValue] : LEVELS.INFO;
};

let currentLevel = normalizeLevel(import.meta.env.VITE_LOG_LEVEL || "INFO");

export const setLogLevel = (level = "INFO") => {
  currentLevel = normalizeLevel(level);
  console.info(`[client-logger] log level set to ${level.toUpperCase()}`);
  return currentLevel;
};

export const getLogLevel = () => currentLevel;

const shouldLog = (level) => currentLevel >= level;

class Logger {
  constructor(context) {
    this.context = context;
  }

  info(message) {
    if (shouldLog(LEVELS.INFO)) {
      console.info(`[INFO] [${this.context}] ${message}`);
    }
  }

  debug(message) {
    if (shouldLog(LEVELS.DEBUG)) {
      console.debug(`[DEBUG] [${this.context}] ${message}`);
    }
  }

  warn(message) {
    console.warn(`[WARN] [${this.context}] ${message}`);
  }

  error(message) {
    console.error(`[ERROR] [${this.context}] ${message}`);
  }
}

export const getLogger = (context) => new Logger(context);
