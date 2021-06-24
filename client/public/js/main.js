// Declare global variables
const dataEndpoint = "/_api/data";

// Run functions in initialization order
function init() {
  getMonitoringData();
  setReloadInterval();
}

// Define the SiteIssue class
class SiteIssue {
  constructor(siteCode, siteName, status, issue, reported, lastContact, type) {
    // Bind method contexts
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);

    // Bind arguments to properties
    this.siteCode = siteCode;
    this.siteName = siteName;
    this.status = status;
    this.issue = issue;
    this.reported = reported;
    this.lastContact = lastContact;
    this.type = type;
    this.parent;
    this.context;
  }

  // Create associated <tr> element in appropriate table
  add() {
    // Find the objects required parent
    if (this.type == "unacknowledged") {
      this.parent = $(".table-unacknowledged > tbody")[0];
    } else {
      this.parent = $(".table-acknowledged > tbody")[0];
    }

    // Add element to parent element
    $(this.parent).append(
      `<tr class="${this.siteCode}-issue">` +
        `<td>${this.siteCode}</td>` +
        `<td>${this.siteName}</td>` +
        `<td>` +
        `<button class="btn btn-xs btn-${this.status.toLowerCase()}">${
          this.status
        }</button>` +
        `</td>` +
        `<td>${this.issue}</td>` +
        `<td>${this.reported}</td>` +
        `<td>${this.lastContact}</td>` +
        `</tr>`
    );

    // Add the created element as the object context
    this.context = $(`.${this.siteCode}`);
  }

  // Removes associated <tr> element from parent table
  remove() {
    $(this.context).remove();
  }
}

// Define EventItem subclass
class EventItem extends SiteIssue {
  constructor(siteCode, siteName, status, issue, reported, lastContact, type) {
    // Invoke parent constructor
    super(siteCode, siteName, status, issue, reported, lastContact, type);
  }

  // Override add method
  add() {
    // Define parent element
    this.parent = $(".event-table > tbody")[0];

    // Build event message
    let eventMsg =
      "[" +
      this.reported +
      "] " +
      this.siteCode +
      " " +
      this.siteName +
      " - " +
      this.issue;

    // Add element to parent element
    $(this.parent).append(
      `<tr class="${this.siteCode}-event">` +
        `<td class="event-icon event-${this.status.toLowerCase()}"></td>` +
        `<td class="text-size-medium">${eventMsg}</td>` +
        `</tr>`
    );
  }

  // Override remove method
  remove() {
    super.remove();
  }
}

// GET monitoring data from backend
function getMonitoringData() {
  $.ajax({
    url: dataEndpoint,
    header: {
      "content-type": "application/json"
    },
    success: results => {
      populateData(results);
    },
    error: err => {
      console.log(err);
    }
  });
}

// Populates the DOM with the site data
// NOTE: Much of the data processing/organising can be moved to backend later
function populateData(data) {
  // Capture data and sort
  let meta = data._meta;
  let issues = data.issues;
  let events = data.events;
  let lastUpdated = new Date(meta.lastupdated);

  // Filter the issue and then sort each
  var criticalIssues = issues.filter(el => el.status === "Critical");
  criticalIssues.sort((prev, curr) => {
    return prev.datetime > curr.datetime;
  });

  var majorIssues = issues.filter(el => el.status === "Major");
  majorIssues.sort((prev, curr) => {
    return prev.datetime > curr.datetime;
  });

  var minorIssues = issues.filter(el => el.status === "Minor");
  minorIssues.sort((prev, curr) => {
    return prev.datetime > curr.datetime;
  });

  let sortedIssues = criticalIssues.concat(majorIssues, minorIssues);

  // Iterate through issues
  for (var i = 0; i < sortedIssues.length; i++) {
    // Capture values
    var siteCode = sortedIssues[i].sitecode;
    var siteName = sortedIssues[i].sitename;
    var status = sortedIssues[i].status;
    var service = toProperCase(sortedIssues[i].service);
    var dateTime = new Date(sortedIssues[i].datetime);
    var lastContacted = calcLastContacted(dateTime);
    var type = "unacknowledged";

    let formattedDate = formatDate(dateTime, "short");

    // Create new SiteIssue object and add to table
    sortedIssues[i] = new SiteIssue(
      siteCode,
      siteName,
      status,
      service,
      formattedDate,
      lastContacted,
      type
    );
    sortedIssues[i].add();
  }

  // Iterate through events
  for (var i = 0; i < events.length; i++) {
    // Capture values
    var siteCode = events[i].sitecode;
    var siteName = events[i].sitename;
    var status = events[i].status;
    var service = toProperCase(events[i].service);
    var dateTime = new Date(events[i].datetime);
    var lastContacted = calcLastContacted(dateTime);
    var type = "unacknowledged";

    let formattedDate = formatDate(dateTime, "long");

    // Create event object and add to eventlog table
    events[i] = new EventItem(
      siteCode,
      siteName,
      status,
      service,
      formattedDate,
      lastContacted,
      type
    );
    events[i].add();
  }

  // Update alert panel HTML values
  $(".status-critical > .panel-text > h1")[0].innerHTML = criticalIssues.length;
  $(".status-major > .panel-text > h1")[0].innerHTML = majorIssues.length;
  $(".status-minor > .panel-text > h1")[0].innerHTML = minorIssues.length;

  // Conditionally light up alert panels
  criticalIssues.length > 0
    ? $(".status-critical").addClass("panel-active")
    : void 0;
  majorIssues.length > 0 ? $(".status-major").addClass("panel-active") : void 0;
  minorIssues.length > 0 ? $(".status-minor").addClass("panel-active") : void 0;
  meta.sitesup === meta.sitecount
    ? $(".status-overall").addClass("panel-active")
    : void 0;

  // Change site totals
  $(".status-overall > .panel-text > h1")[0].innerHTML = `${meta.sitesup}/${
    meta.sitecount
  }`;

  // Update last updated
  $(".data-last-updated .val")[0].innerHTML = formatDate(lastUpdated, "medium");
}

// Refreshes the site monitoring data
function setReloadInterval() {
  setInterval(() => {
    location.reload();
  }, 60000);
}

/* ---- HELPER FUNCTIONS ----
---------------------------*/

// Define String method to convert to propercase
function toProperCase(str) {
  return str.replace(/\w\S*/g, txt => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Calculates the time last contacted
function calcLastContacted(issueDate) {
  // Create date obj
  var currDateTime = new Date();
  var issueDate = new Date(issueDate);

  // Calculate difference
  var timeDifInMs = currDateTime - issueDate;
  var timeDifInHrs = timeDifInMs / (1000 * 60 * 60);

  // Convert from decimal to hr/min and round down
  var timeDifHrs = Math.floor(timeDifInHrs);
  var timeDifMins = Math.floor((timeDifInHrs - timeDifHrs) * 60);

  // Convert to string format and return
  var timeDifAsStr = timeDifHrs + "h" + " " + timeDifMins + "m";

  return timeDifAsStr;
}

// Reformats datetime objects into string
function formatDate(dateObj, form) {
  // Reformat current date
  let date = [
    zeroPad(dateObj.getDate()),
    zeroPad(dateObj.getMonth() + 1),
    dateObj
      .getFullYear()
      .toString()
      .substring(2)
  ].join("/");

  // Formats time based on desired form (long is with milliseconds)
  switch (form) {
    case "short":
      var time = [
        zeroPad(dateObj.getHours()),
        zeroPad(dateObj.getMinutes())
      ].join(":");
      break;

    case "medium":
      var time = [
        zeroPad(dateObj.getHours()),
        zeroPad(dateObj.getMinutes()),
        zeroPad(dateObj.getSeconds())
      ].join(":");
      break;

    case "long":
      var time = [
        zeroPad(dateObj.getHours()),
        zeroPad(dateObj.getMinutes()),
        zeroPad(dateObj.getSeconds()),
        dateObj.getMilliseconds()
      ].join(":");
      break;
  }

  // Join together and return
  let dateTime = date + " " + time;

  return dateTime;
}

// Converts single digit integers to zero-padded digits
function zeroPad(num) {
  return ("0" + num).slice(-2);
}

// Load init on page ready
$(document).ready(function() {
  init();
});
