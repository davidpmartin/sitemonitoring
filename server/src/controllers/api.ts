import { Request, Response, NextFunction } from "express";
import mongodb from "mongodb";
import Issue, { IIssue } from "@models/issue";
import Event, { IEvent } from "@models/event";
import Meta, { IMeta } from "@models/meta";
import app from "@lib/app";
import log4js from "log4js";

const logger = log4js.getLogger("controller");

/**
 * POST - Main service update
 * This is the primary update method used to pass issue data into the site monitoring
 *  backend. It expects JSON in the body, which is validated in an earlier middleware.
 */
export const db_update = (req: Request, res: Response, next: NextFunction) => {
  logger.info("\n");

  try {
    logger.info("----------------------------------");
    logger.info("POST received from: " + req.ip);
    logger.info("Req body:-");
    logger.info(JSON.stringify(req.body, null, 2));

    // Organise data
    let metaData: IMeta = req.body._meta;
    let issues: IIssue[] = req.body.issues;
    let resolvedIssues: IIssue[] = [];

    // Define operations to perform on promises
    Promise.all([Meta.find().exec(), Issue.find({}).exec()])
      .then(results => {
        logger.info("Starting database operations:");
        logger.info(" ");

        // Store query results
        let dbMeta: IMeta = results[0][0];
        let dbIssues: IIssue[] = results[1];

        // First check if the homesite has a critical issue
        let homeSiteIssue: IIssue = issues.filter((issue: IIssue) => {
          return (
            issue.sitecode == Number(process.env.HOME_SITE_CODE) &&
            issue.category == "critical"
          );
        })[0];

        homeSiteIssue
          ? (metaData.homesitedown = true)
          : (metaData.homesitedown = false);

        //---------------
        //Meta:
        //-----------------
        // If metadata DB object exist update it
        if (dbMeta) {
          logger.info("Meta object already exists in db");

          Meta.findOneAndUpdate(
            {},
            {
              lastupdated: metaData.lastupdated,
              sitecount: metaData.sitecount,
              sitesup: metaData.sitesup,
              homesitedown: metaData.homesitedown
            }
          ).catch(err => {
            logger.error(err);
          });
        }

        // Otherwise create new DB object
        else {
          logger.info("Meta object doesn't exist. Creating...");
          var meta = new Meta({
            lastupdated: metaData.lastupdated,
            sitecount: metaData.sitecount,
            sitesup: metaData.sitesup,
            homesitedown: metaData.homesitedown
          });
          meta
            .save()
            .then(() => logger.info("New MetaData entry has been created"))
            .catch(err => {
              logger.error(err);
            });
        }

        //-----------------
        //Issues:
        //-----------------
        // If the homesite is down, check if an existing issue for homesite exists. If so,
        // do nothing; if not, create.
        //
        // For posted issues, if it doesn't exist in the database it is a new issue
        // For DB issues not in the posted issues where there is not a breakpoint issue
        // currently at that site, the issue no longer exists

        // Check if there is an existing issue for the homesite
        let existingHomeSiteIssue = dbIssues.filter(dbIssue => {
          return (
            dbIssue.sitecode == Number(process.env.HOME_SITE_CODE) &&
            dbIssue.category == "critical"
          );
        })[0];

        // If homesite issue was reported
        if (homeSiteIssue != undefined) {
          logger.info(
            `Host site "${homeSiteIssue.sitecode}" is reported as down`
          );

          // If no current issue, create one
          if (existingHomeSiteIssue == undefined) {
            logger.info(
              `Creating new DB object for ${homeSiteIssue.category} at ${homeSiteIssue.sitecode} ${homeSiteIssue.sitename}`
            );
            var issue = new Issue({
              sitecode: homeSiteIssue.sitecode,
              sitename: homeSiteIssue.sitename,
              category: homeSiteIssue.category,
              service: homeSiteIssue.service,
              target: homeSiteIssue.target,
              datetime: homeSiteIssue.datetime
            });
            issue
              .save()
              .then(() => logger.info("New issue created"))
              .catch(err => {
                logger.info(
                  `Error on ${issue.sitecode} for issue ${issue.service}\n${err}`
                );
              });

            // Create the corresponding event
            var event = new Event({
              sitecode: homeSiteIssue.sitecode,
              sitename: homeSiteIssue.sitename,
              category: homeSiteIssue.category,
              service: homeSiteIssue.service,
              target: homeSiteIssue.target,
              datetime: homeSiteIssue.datetime
            });
            event
              .save()
              .then(() => logger.info("New event created"))
              .catch(err => {
                logger.error(err);
              });
          }
        }

        // If homesite is not down
        else {
          // Iterate through each DB issue
          for (var i = 0; i < dbIssues.length; i++) {
            // Get posted issues that are critical at site
            let siteCriticals = issues.filter(issue => {
              return (
                issue.sitecode == dbIssues[i].sitecode &&
                issue.category.toLowerCase() == "critical"
              );
            })[0];

            // Search for issue match in posted issues
            var match = issues.find(issue => {
              return (
                dbIssues[i].sitecode == issue.sitecode &&
                dbIssues[i].service == issue.service
              );
            });

            // If a new issue was not posted and there are no criticals at the site
            if (!match && !siteCriticals) {
              logger.info(
                `${dbIssues[i].service} issue at ${dbIssues[i].sitecode} ${dbIssues[i].sitename} no longer exists and will be removed`
              );

              Issue.deleteOne(
                { _id: new mongodb.ObjectID(dbIssues[i]._id) }
              ).catch(err => {
                    logger.error(`Failed to delete issue.`);
                    throw err;
              });

              // Add to issues resolved
              resolvedIssues.push(dbIssues[i]);
            }
            // Else remove the request issue (as it does not need to be added to DB)
            else if (match) {
              // Get index to remove
              let matchIndex = issues.indexOf(match);
              logger.info(
                `${issues[matchIndex].service} issue for ${issues[matchIndex].sitecode} ${issues[matchIndex].sitename} already exists in the DB`
              );
              issues.splice(matchIndex, 1);
            }
          }

          // Create a DB issue for each remaining req issue
          for (var i = 0; i < issues.length; i++) {
            logger.info(
              `Creating new DB object for ${issues[i].service} at ${issues[i].sitecode} ${issues[i].sitename}`
            );
            var issue = new Issue({
              sitecode: issues[i].sitecode,
              sitename: issues[i].sitename,
              category: issues[i].category,
              service: issues[i].service,
              target: issues[i].target,
              datetime: issues[i].datetime
            });
            issue
              .save()
              .then(() => logger.info("DB: Issue created"))
              .catch(err => {
                logger.error(
                  `Error on ${issue.sitecode} for issue ${issue.service}\n${err}`
                );
              });
          }

          //---------------
          //Events:
          //-----------------
          // New events are: All BD issues not found in posted issues (resolved)
          //  and all issues not found in DB (new)
          var newEvents = [];

          // Create a new event object for each of the resolved issues
          for (var i = 0; i < resolvedIssues.length; i++) {
            newEvents.push(
              new Event({
                sitecode: resolvedIssues[i].sitecode,
                sitename: resolvedIssues[i].sitename,
                category: "Resolved",
                service: resolvedIssues[i].service,
                target: resolvedIssues[i].target,
                datetime: metaData.lastupdated
              })
            );
          }

          // Create new event object for each of the issues not existing in the DB
          for (var i = 0; i < issues.length; i++) {
            newEvents.push(
              new Event({
                sitecode: issues[i].sitecode,
                sitename: issues[i].sitename,
                category: issues[i].category,
                service: issues[i].service,
                target: issues[i].target,
                datetime: issues[i].datetime
              })
            );
          }

          // Sort events by newest to oldest
          newEvents.sort((prev, curr) => {
            return prev.datetime > curr.datetime
              ? -1
              : prev.datetime < curr.datetime
              ? 1
              : 0;
          });

          // Save each new event to the DB
          newEvents.forEach(event => {
            event
              .save()
              .then(() => logger.info("New event created"))
              .catch(err => {
                logger.error(err);
              });
          });
        }

        // Sent response to request client
        res.send();
        logger.info(" ");
        logger.info("Database operations completed.");

        //---------------
        //End tasks:
        //-----------------
        // Emit post received to listeners
        logger.info(" ");
        logger.info("Emitting change notification to socket listeners...");
        var io: SocketIO.Server = app.getSocketConnection();
        let isUpdate: boolean = true;
        io.emit("STATUS_UPDATE", isUpdate);

        logger.info(" ");
        logger.info("All tasks completed");
        logger.info("----------------------------------");
      })
      .catch(err => {
        logger.info(err);
      });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET - Event list
 * This is simply a report of the event list in its entirety, this was
 * required for a specific purpose previously, however now it is unlikely
 * to be used and can probably be removed.
 */
export const event_list = (req: Request, res: Response) => {
  Event.find({}).then(issue => res.json(issue));
};

/**
 * GET - Raw database data
 * This present a mostly raw reports of the database meta, issue and event
 * data. As above, this most likely won't see continued use as the data
 * processing previously performed on the client is now done server-side
 * (see below) on a dedicated end-point.
 */
export const all_site_data = (req: Request, res: Response) => {
  Promise.all([Meta.find({}), Issue.find({}), Event.find({})]).then(results => {
    let meta = results[0][0];
    let issues = results[1];
    let events = results[2];

    // Sort events by newest to oldest
    events = events.sort((prev, curr) => {
      return prev.datetime > curr.datetime
        ? -1
        : prev.datetime < curr.datetime
        ? 1
        : 0;
    });

    // Trim down to the newest 50 events
    events = events.slice(0, 50);

    let resObj = {
      _meta: meta,
      issues: issues,
      events: events
    };
    res.send(resObj);
  });
};

/**
 * GET - Formated data
 * This is the primary endpoint for client retrieval of site monitoring
 * data. Some minor data extraction and condensing operations are performed
 * to clean up the data before sending.
 */
export const condensed_site_data = (req: Request, res: Response) => {
  logger.info("Retrieving formatted monitoring data");
  // Do DB query and grab results
  Promise.all([Meta.find({}), Issue.find({}), Event.find({})]).then(results => {
    var metaData = results[0][0];
    var issueData = results[1];
    var eventData = results[2];

    // If metaData is undefined then DB is fresh
    if (metaData == undefined) {
      console.log(
        "Unable to load data from DB. A successful POST has likely not occured"
      );
      return res.sendStatus(204);
    }

    // Process the metadata
    let _meta = {
      lastpost: metaData.lastupdated,
      lastupdated: metaData.lastupdated,
      sitesup: metaData.sitesup,
      sitecount: metaData.sitecount,
      homesitedown: metaData.homesitedown
    };

    // Process the issues
    var condensedIssues = [];

    // If homesite is down, only add that issue
    if (metaData.homesitedown) {
      condensedIssues[0] = issueData.find(issue => {
        return (
          issue.sitecode == Number(process.env.HOME_SITE_CODE) &&
          issue.category == "critical"
        );
      });
    }

    // Else add all the existing issues
    else {
      for (var i = 0; i < issueData.length; i++) {
        condensedIssues[i] = {
          sitename: issueData[i].sitename,
          sitecode: issueData[i].sitecode,
          category: issueData[i].category,
          service: issueData[i].service,
          target: issueData[i].target,
          datetime: issueData[i].datetime,
          lastcontacted: issueData[i].datetime
        };
      }
    }

    // Sort events by newest to oldest
    eventData.sort((prev, curr) => {
      return prev.datetime > curr.datetime
        ? -1
        : prev.datetime < curr.datetime
        ? 1
        : 0;
    });

    // Limit events to most recent 50
    eventData = eventData.slice(0, 50);

    // Process the events
    var condensedEvents = [];
    for (var i = 0; i < eventData.length; i++) {
      condensedEvents[i] = {
        sitename: eventData[i].sitename,
        sitecode: eventData[i].sitecode,
        category: eventData[i].category,
        service: eventData[i].service,
        datetime: eventData[i].datetime,
        target: eventData[i].target,
        lastcontacted: eventData[i].datetime
      };
    }

    // Compile return object
    let resObj = {
      _meta: _meta,
      issues: condensedIssues,
      events: condensedEvents
    };

    logger.info("Dispatching...");
    res.send(resObj);
  });
};

/**
 * GET - Event data
 * This is used to retrived additional event data as the 'load more' button
 * in the event view is pressed. This end point relies on a date to be
 * passed along with the requests so it knows where in the event history
 * to retrieve from.
 */
export const events_since_date = (req: Request, res: Response) => {
  // Extract date from the
  const eventDate = new Date(Number(req.params.since));

  // Query database for the 30 events prior to passed date
  const eventQuery = Event.find({ datetime: { $lt: eventDate } }).limit(30);

  eventQuery
    .exec()
    .then(results => {
      if (results.length === 0) {
        logger.info("No more events to send");
        res.sendStatus(204);
      } else {
        // Sort events by newest to oldest
        results.sort((prev, curr) => {
          return prev.datetime > curr.datetime
            ? -1
            : prev.datetime < curr.datetime
            ? 1
            : 0;
        });

        // Returns the results
        res.send(results);
      }
    })
    .catch(err => {
      logger.error("Error performing query", err);
      res.send(500);
    });
};
