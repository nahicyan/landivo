const LEVELS = {
  OFF: 0,
  INFO: 1,
  DEBUG: 2,
};

let currentLevel = LEVELS.INFO;

const normalizeLevel = (value) => {
  const normalizedValue = (value || "").toString().toUpperCase();
  return LEVELS.hasOwnProperty(normalizedValue) ? LEVELS[normalizedValue] : LEVELS.INFO;
};

export const setLogLevel = (level = "INFO") => {
  currentLevel = normalizeLevel(level);
  console.info(`[logger] log level set to ${level.toUpperCase()}`);
  return currentLevel;
};

export const getLogLevel = () => currentLevel;

const shouldLog = (level) => currentLevel >= level;

const formatOutput = (level, context, message) => {
  const normalizedMessage =
    typeof message === "string"
      ? message
      : JSON.stringify(message, Object.getOwnPropertyNames(message));
  return `[${level}] [${context}] ${normalizedMessage}`;
};

class Logger {
  constructor(context) {
    this.context = context;
  }

  info(message) {
    if (!shouldLog(LEVELS.INFO)) return;
    console.log(formatOutput("INFO", this.context, message));
  }

  debug(message) {
    if (!shouldLog(LEVELS.DEBUG)) return;
    console.debug(formatOutput("DEBUG", this.context, message));
  }

  warn(message) {
    console.warn(formatOutput("WARN", this.context, message));
  }

  error(message) {
    console.error(formatOutput("ERROR", this.context, message));
  }
}

export const getLogger = (context) => new Logger(context);
