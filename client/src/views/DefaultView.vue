<template>
  <div id="default-view">
    <div class="container col-md-9">
      <issue-list :issue-data="issueData" />
    </div>
    <div class="container col-md-3">
      <event-log :event-data="eventData" />
    </div>
  </div>
</template>

<script>
import IssueList from "../components/IssueList";
import EventLog from "../components/EventLog";

export default {
  name: "DefaultView",
  props: ["issueData", "eventData"],
  components: {
    IssueList: IssueList,
    EventLog: EventLog
  },
  data: function() {
    return {};
  }
};
</script>

<style scoped>
#default-view {
  display: flex;
  width: 100%;
}
</style>
