import express from "express";
import {
  db_update,
  all_site_data,
  condensed_site_data,
  events_since_date
} from "@controllers/api";

// Declare router
export const router = express.Router();

// POST routes
router.post("/data/update", db_update);

// GET routes
router.get("/data/all", all_site_data);
router.get("/data/min", condensed_site_data);
router.get("/data/events/:since", events_since_date);
