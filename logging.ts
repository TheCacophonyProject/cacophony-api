import config from "./config";
import winston from "winston";
import expressWinston from "express-winston";

const consoleTransport = new winston.transports.Console({
  name: "console",
  level: config.server.loggerLevel,
  colorize: true,
  handleExceptions: true,
  humanReadableUnhandledException: true
});

const logger = new winston.Logger({
  transports: [consoleTransport]
});

logger.addExpressApp = function (app) {
  app.use(
    expressWinston.logger({
      transports: [consoleTransport],
      meta: false,
      expressFormat: true
    })
  );
};

export default logger;
