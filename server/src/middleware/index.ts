import {
  handleLogger,
  handleCors,
  handleParsers,
  handleBearerToken,
  handleValidation
} from "./common";

export const middleware = [
  handleLogger,
  handleCors,
  handleParsers,
  handleBearerToken,
  handleValidation
];
