// Helper functions for API controller
export default {
  /**
   * Converts single digit integers to zero-padded digits
   * @param {integer} num
   */
  zeroPad: function(num: Number) {
    return ("0" + num).slice(-2);
  },

  /**
   * Reformats datetime objects into string
   * @param {date} dateObj
   * @param {string} form
   */
  formatDate: function(dateObj: Date, form: string) {
    let time = "";
    let date = [
      module.exports.zeroPad(dateObj.getDate()),
      module.exports.zeroPad(dateObj.getMonth() + 1),
      dateObj
        .getFullYear()
        .toString()
        .substring(2)
    ].join("/");

    // Formats time based on desired form (long is with milliseconds)
    switch (form) {
      case "short":
        time = [
          module.exports.zeroPad(dateObj.getHours()),
          module.exports.zeroPad(dateObj.getMinutes())
        ].join(":");
        break;

      case "medium":
        time = [
          module.exports.zeroPad(dateObj.getHours()),
          module.exports.zeroPad(dateObj.getMinutes()),
          module.exports.zeroPad(dateObj.getSeconds())
        ].join(":");
        break;

      case "long":
        time = [
          module.exports.zeroPad(dateObj.getHours()),
          module.exports.zeroPad(dateObj.getMinutes()),
          module.exports.zeroPad(dateObj.getSeconds()),
          dateObj.getMilliseconds()
        ].join(":");
        break;
    }

    // Join together and return
    let dateTime = date + " " + time;

    return dateTime;
  },

  /**
   * Define String method to convert to propercase
   * @param {string} str
   */
  toProperCase: function(str: string) {
    return str.replace(/\w\S*/g, txt => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },

  /**
   * Calculates the time since the inputed date, presenting in units of minutes, hours, days etc
   * @param {number} issueDate
   */
  calcLastContacted: function(date: number) {
    // Create date obj
    var currDateTime: any = new Date();
    var issueDate: any = new Date(date);

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
  }
};
