import log4js from "log4js";
import { Request, Response, NextFunction } from "express";

const logger = log4js.getLogger("http");

// Logger middleware to post http request details. Eg: GET 10.169.169.192:5000/_api/v2/issues
export const reqLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.hostname}${req.originalUrl}`);
  next();
};
