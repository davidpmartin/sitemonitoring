<template>
  <div id="app">
    <section class="content">
      <Header
        :meta-data="formattedMetaData"
        :has-notif="hasNotif"
        :notif-type="notifType"
        :notif-msg="notifMsg"
      />
      <div class="main-container">
        <alert-panels :meta-data="formattedMetaData" />
        <div class="row">
          <router-view :issue-data="formattedIssueData" :event-data="formattedEventData"></router-view>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from "axios";
import io from "socket.io-client";
import Header from "./components/Header";
import AlertPanels from "./components/AlertPanels";
import EventBus from "./eventBus";
import { setInterval, clearInterval } from "timers";

const nodePath = process.env.VUE_APP_SERVER_PATH;
const apiDataPath = process.env.VUE_APP_API_ALL_DATA;
const apiEventPath = process.env.VUE_APP_API_MORE_EVENTS;

export default {
  name: "app",
  components: {
    Header: Header,
    AlertPanels: AlertPanels
  },

  data() {
    return {
      // Data values
      metaData: null,
      issueData: null,
      eventData: null,
      formattedMetaData: null,
      formattedIssueData: null,
      formattedEventData: null,

      // Polling & Intervals
      interval: null,
      lastDataUpdate: null,
      socket: io(nodePath),

      // Notification vals
      hasNotif: false,
      notifType: null,
      notifMsg: null,
      homesitedown: false
    };
  },
  methods: {
    /**
     * Gets site data from the server
     */
    getSiteData: function() {
      axios
        .get(apiDataPath)
        .then(res => {
          // Reset notification
          this.hasNotif = false;
          this.notifType = "";
          this.notifMsg = "";

          // Parse data
          this.metaData = res.data._meta;
          this.issueData = res.data.issues;
          this.eventData = res.data.events;
          this.formatData();
          this.lastDataUpdate = new Date(res.data._meta.lastpost);
          this.checkDataAge();

          if (this.metaData.homesitedown == true) {
            this.hasNotif = true;
            this.notifType = "error";
            this.notifMsg = "Home site reported as down";
          }
        })
        .catch(err => {
          this.hasNotif = true;
          this.notifType = "error";
          this.notifMsg = "Latest data request to server failed";
          console.log(err);
        });
    },

    /**
     * Loads more events - Uses the oldest local event as the reference
     */

    loadEvents: function() {
      // Pass the oldest event date in the query as a reference
      const oldestEvent = this.eventData[this.eventData.length - 1];
      const eventDate = new Date(oldestEvent.datetime);
      const eventsUrlQuery = apiEventPath + "/" + eventDate.getTime();

      // Get events older that the specified event date
      axios
        .get(eventsUrlQuery)
        .then(res => {
          // Store and format data as required
          let returnedEvents = res.data.reverse();
          this.eventData = this.eventData.concat(res.data.reverse());
          let formattedReturnedEvents = this.formatEvents(returnedEvents);
          this.formattedEventData = this.formattedEventData.concat(
            formattedReturnedEvents
          );
        })
        .catch(err => {
          console.log(err);
        });
    },

    /**
     * Formats the issue/event data into its presentation form
     */
    formatData: function() {
      this.formattedMetaData = this.formatMeta(this.metaData);
      this.formattedIssueData = this.formatIssues(this.issueData);
      this.formattedEventData = this.formatEvents(this.eventData);
    },

    /**
     * Formats the meta data
     */
    formatMeta: function(meta) {
      // Process the metadata
      const formattedMeta = {
        lastpost: meta.lastupdated,
        lastupdated: this.formatDate(new Date(meta.lastupdated), "medium"),
        sitesup: meta.sitesup,
        sitecount: meta.sitecount
      };

      return formattedMeta;
    },

    /**
     * Formats the issue data
     */
    formatIssues: function(issues) {
      // Filter the issues by type and sort each by most recent
      var criticalIssues = issues.filter(
        el => el.category.toLowerCase() === "critical"
      );
      criticalIssues.sort((prev, curr) => {
        return prev.datetime < curr.datetime;
      });

      var majorIssues = issues.filter(
        el => el.category.toLowerCase() === "major"
      );
      majorIssues.sort((prev, curr) => {
        return prev.datetime < curr.datetime;
      });

      var minorIssues = issues.filter(
        el => el.category.toLowerCase() === "minor"
      );

      minorIssues.sort((prev, curr) => {
        return prev.datetime < curr.datetime;
      });

      // Merge issue data
      issues = criticalIssues.concat(majorIssues, minorIssues);

      // Process and store the issue data
      const formattedIssues = [];
      for (var i = 0; i < issues.length; i++) {
        formattedIssues[i] = {
          sitename: issues[i].sitename,
          sitecode: issues[i].sitecode,
          category: this.toProperCase(issues[i].category),
          service: this.toProperCase(issues[i].service),
          target: issues[i].target,
          datetime: this.formatDate(new Date(issues[i].datetime), "medium"),
          lastcontacted: this.calcLastContacted(issues[i].datetime)
        };
      }

      // Set respective count vals in the meta data
      this.formattedMetaData.criticals = criticalIssues.length;
      this.formattedMetaData.majors = majorIssues.length;
      this.formattedMetaData.minors = minorIssues.length;

      return formattedIssues;
    },

    /**
     * Formats the event data
     */
    formatEvents: function(events) {
      // Process the events
      const formattedEvents = [];
      for (var i = 0; i < events.length; i++) {
        formattedEvents[i] = {
          sitename: events[i].sitename,
          sitecode: events[i].sitecode,
          category: this.toProperCase(events[i].category),
          service: this.toProperCase(events[i].service),
          target: events[i].target,
          datetime: this.formatDate(new Date(events[i].datetime), "long"),
          lastcontacted: this.calcLastContacted(events[i].datetime)
        };
      }

      return formattedEvents;
    },

    /**
     * Performs the data age checks
     */
    checkDataAge: function() {
      let timer = 1000 * 60 * 5;
      let currTime = new Date();
      if (currTime - this.lastDataUpdate > timer) {
        if (this.hasNotif == false) {
          this.notifType = "warning";
          this.notifMsg = "Data from server is more than 5 minutes old";
          this.hasNotif = true;
        }
      } else {
        this.hasNotif = false;
      }
    },

    /**
     * Helper function to format the date values
     */
    formatDate: function(dateObj, form) {
      var time;
      let date = [
        this.zeroPad(dateObj.getDate()),
        this.zeroPad(dateObj.getMonth() + 1),
        dateObj
          .getFullYear()
          .toString()
          .substring(2)
      ].join("/");

      // Formats time based on desired form (long is with milliseconds)
      switch (form) {
        case "short":
          time = [
            this.zeroPad(dateObj.getHours()),
            this.zeroPad(dateObj.getMinutes())
          ].join(":");
          break;

        case "medium":
          time = [
            this.zeroPad(dateObj.getHours()),
            this.zeroPad(dateObj.getMinutes()),
            this.zeroPad(dateObj.getSeconds())
          ].join(":");
          break;

        case "long":
          time = [
            this.zeroPad(dateObj.getHours()),
            this.zeroPad(dateObj.getMinutes()),
            this.zeroPad(dateObj.getSeconds()),
            dateObj.getMilliseconds()
          ].join(":");
          break;
      }

      // Join together and return
      let dateTime = date + " " + time;

      return dateTime;
    },

    /**
     * Helper function to apply proper case to a string
     */
    toProperCase: function(str) {
      return str.replace(/\w\S*/g, txt => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },

    /**
     * Helper function to format the date values
     */
    calcLastContacted: function(date) {
      // Create date obj
      var currDateTime = new Date();
      var issueDate = new Date(date);

      // Calculate differences
      var timeDifInMs = currDateTime - issueDate;
      var timeDifInMins = timeDifInMs / (1000 * 60);
      var timeDifInHrs = timeDifInMins / 60;
      var timeDifInDays = timeDifInHrs / 24;

      // Round down to nearest integer
      var timeDifDays = Math.floor(timeDifInDays);
      var timeDifHrs = Math.floor((timeDifInDays - timeDifDays) * 24);
      var timeDifMins = Math.floor(
        (timeDifInHrs - (timeDifDays * 24 + timeDifHrs)) * 60
      );

      // Convert to string format and return
      var timeDifAsStr =
        (timeDifDays != 0 ? timeDifDays + "d" + " " : "") +
        (timeDifHrs != 0 ? timeDifHrs + "h" + " " : "") +
        timeDifMins +
        "m";

      return timeDifAsStr;
    },

    /**
     * Zero pads an integer if required
     */
    zeroPad: function(num) {
      return ("0" + num).slice(-2);
    }
  },

  // Run a get on component creation
  async created() {
    await this.getSiteData();
  },

  // On component mount
  mounted() {
    this.interval = setInterval(() => {
      this.checkDataAge();
    }, 60000);

    this.socket.on("connection", () => {
      console.log("Established web socket with server");
    });

    // On disconnection
    this.socket.on("disconnect", () => {
      this.notifType = "error";
      this.notifMsg = "Connection to server lost";
      this.hasNotif = true;
    });

    // On reconnection
    this.socket.on("reconnect", () => {
      this.hasNotif = false;
      this.notifMsg = "";
      this.getSiteData();
    });

    // On status update from server
    this.socket.on("STATUS_UPDATE", isNewData => {
      if (isNewData) {
        this.socket.emit("UPDATE_ACK");
        this.getSiteData();
      }
    });

    // On initial connection fail
    this.socket.on("connect_error", () => {
      this.notifType = "error";
      this.notifMsg = "Connection to server lost";
      this.hasNotif = true;
    });

    // Listener for the load more events trigger
    EventBus.$on("load-events", () => this.loadEvents());
  },

  // On component destruction
  beforeDestroy() {
    clearInterval(this.interval);
  }
};
</script>

<style>
</style>
