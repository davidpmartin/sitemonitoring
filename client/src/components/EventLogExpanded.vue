<template>
  <div class="table-wrapper panel" v-bind:style="{ 'max-height': divHeight + 'px' }">
    <table class="table">
      <tr class="table-expanded-header">
        <th>Code</th>
        <th>Name</th>
        <th>Category</th>
        <th>Device</th>
        <th>Target</th>
        <th>State</th>
        <th>Timestamp</th>
      </tr>
      <tr
        class="table-expanded-body"
        v-bind:class="'tab-' + event.category.toLowerCase()"
        v-bind:key="event._id"
        v-for="event in eventData"
      >
        <td>{{ event.sitecode }}</td>
        <td>{{ event.sitename }}</td>
        <td>
          <button
            v-bind:class="
              'btn status-indicator btn-xs btn-' + event.category.toLowerCase()
            "
          >{{ event.category }}</button>
        </td>
        <td>{{ event.service }}</td>
        <td>{{ event.target }}</td>
        <td>{{ event.category === "Resolved" ? "Up" : "Down" }}</td>
        <td>{{ event.datetime }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
  name: "EventLogExpanded",
  props: ["eventData"],
  data: function() {
    return {
      divHeight: null
    };
  },
  methods: {
    updateHeight: function() {
      this.divHeight =
        window.innerHeight - this.$el.getBoundingClientRect().top - 100;
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

<style scoped></style>
