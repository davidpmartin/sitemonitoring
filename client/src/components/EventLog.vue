<template>
  <div class="event-grid grid panel" v-bind:style="{ 'max-height': divHeight + 'px' }">
    <div class="event-grid-header grid-header row" @click="$router.push(url)">
      <div class="event-title">Event Log</div>
    </div>
    <div
      class="event-grid-body row"
      v-bind:key="event._id"
      v-bind:class="'event-' + event.category.toLowerCase()"
      v-for="event in eventData"
    >
      <div v-bind:class="'text-size-medium'">
        {{
        "[" + event.datetime + "]" +
        " " + event.sitecode +
        " " + event.sitename +
        " - " + event.service
        }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EventLog",
  props: ["eventData", "isExpanded"],
  data: function() {
    return {
      divHeight: null,
      url: "/events"
    };
  },
  methods: {
    updateHeight: function() {
      this.divHeight =
        window.innerHeight - this.$el.getBoundingClientRect().top - 50;
    }
  },
  mounted() {
    window.addEventListener("resize", this.updateHeight);
    this.updateHeight();
  },
  updated: function() {
    this.updateHeight();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateHeight);
  }
};
</script>

<style scoped>
.event-grid {
  overflow: auto;
}

.event-grid:nth-child(2) {
  border-top: none;
}

.event-grid::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}

.event-grid::-webkit-scrollbar {
  width: 6px;
  background-color: #f5f5f5;
}

.event-grid::-webkit-scrollbar-thumb {
  background-color: rgba(68, 70, 79, 0.5);
}

.event-grid-header {
  margin: 0;
  background-color: rgb(57, 60, 68);
  border-bottom: 1px solid #dee2e617;

  /*Stick to top of scrollable table*/
  position: sticky;
  top: 0;
  z-index: 1;
}

.event-title {
  padding: 0.7rem 0.5rem;
  padding-left: 1rem;
  font-size: 0.8rem;
}

.event-grid-body {
  color: hsla(0, 0%, 100%, 0.7);
  border-top: 1px solid #dee2e617;
  border-left: 12px solid transparent;
  margin-bottom: 2px;
  margin-left: 0px;
  margin-right: 0px;
}

.event-grid-body div {
  font-size: 0.7rem;
  padding: 0.6rem;
  padding-left: 1rem;
}

.event-title:hover {
  text-decoration: none;
  color: hsla(0, 0%, 100%, 0.8);
}
</style>