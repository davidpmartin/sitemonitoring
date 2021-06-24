import express, { Router, Request, Response } from "express";
import cors from "cors";
import bearerToken from "express-bearer-token";
import validation from "@middleware/validation";
import { reqLogger } from "./logger";

// HTTP request logger
export const handleLogger = (router: Router) => {
  router.use(reqLogger);
};

// Cross Origin Resource Sharing
export const handleCors = (router: Router) => {
  router.use(cors());
};

// Parsers
export const handleParsers = (router: Router) => {
  router.use(express.json({ limit: "1mb" }));
  router.use(express.urlencoded({ extended: true }));
};

// Bearer token
export const handleBearerToken = (router: Router) => {
  router.use(bearerToken());
};

// Set validation
export const handleValidation = (router: Router) => {
  router.post(
    "/data/update",
    validation.checkBearerToken,
    validation.dataConditions,
    validation.checkData
  );
};
