export const logger = {
  info: (message, data = null) => {
    console.log(`INFO: ${message}`, data || "");
  },

  error: (message, error = null) => {
    console.error(`ERROR: ${message}`, error || "");
  },

  warn: (message, data = null) => {
    console.warn(`WARNING: ${message}`, data || "");
  },
};
