import { check, validationResult } from "express-validator";
import * as express from "express";

// Middleware function to perform various validation checks
export default {
  /**
   * Validates incoming tokens
   */
  checkBearerToken: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    let validToken: string;
    validToken = process.env.API_TOKEN!.split(" ")[1];
    if (!req.token) {
      res.status(401).send("Bearer token not provided");
    } else if (req.token != validToken) {
      res.status(401).send("Bearer token is not valid");
    } else {
      next();
    }
  },

  /**
   * An array of data conditions to be parsed by the below checkData fuction
   */
  dataConditions: [
    check("_meta", "meta object not found in request body").exists(),
    check(
      "_meta.lastupdated",
      "meta.lastupdated property not found in request body"
    ).exists(),
    check(
      "_meta.sitecount",
      "meta.sitecount property not found in request body"
    )
      .exists()
      .isInt(),
    check("_meta.sitesup", "meta.sitesup property not found in request body")
      .exists()
      .isInt(),

    check(
      "issues",
      "issues object not found in request body or is not an array"
    )
      .exists()
      .isArray(),
    check("issues.*.sitecode", "property either not found or is not an int")
      .exists()
      .isInt(),
    check("issues.*.sitename", "property either not found or is not a string")
      .exists()
      .isString(),
    check("issues.*.category", "property either not found or is not a string")
      .exists()
      .isString(),
    check("issues.*.service", "property either not found or is not a string")
      .exists()
      .isString(),
    check("issues.*.target", "property either not found or is not a string")
      .exists()
      .isString(),
    check("issues.*.datetime", "property either not found or is not a string")
      .exists()
      .isString()
  ],

  /**
   * Runs the validation against the post body using the previously defined conditions
   */
  checkData: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      next();
    }
  }
};
