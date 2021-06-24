<template>
  <div class="event-view col-md-12">
    <event-log-expanded :event-data="eventData" />
    <div class="event-bottom">
      <btn v-on:click.native="loadEvents" v-html="load" />
      <btn v-on:click.native="$router.push(defaultViewUrl)" v-html="close" />
    </div>
  </div>
</template>

<script>
import EventLogExpanded from "../components/EventLogExpanded";
import Btn from "../components/Btn";
import EventBus from "../eventBus.js";

export default {
  name: "EventView",
  props: ["eventData"],
  components: {
    EventLogExpanded: EventLogExpanded,
    Btn: Btn
  },
  data: function() {
    return {
      defaultViewUrl: "/",
      close: "&#215;",
      load: "&#43;"
    };
  },
  methods: {
    loadEvents: function() {
      console.log("asd123");
      EventBus.$emit("load-events");
    }
  }
};
</script>

<style scoped>
.event-bottom {
  text-align: center;
}
</style>
