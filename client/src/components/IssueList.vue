<template>
  <div class="table-wrapper panel" v-bind:style="{ 'max-height': divHeight + 'px' }">
    <table class="table">
      <tr class="table-header" @click="$router.push(url)">
        <th>Code</th>
        <th>Name</th>
        <th>Category</th>
        <th>Device</th>
        <th>Reported</th>
        <th>Last Contact</th>
      </tr>
      <tr
        class="table-body"
        v-bind:class="'tab-' + issue.category.toLowerCase()"
        v-bind:key="issue._id"
        v-for="issue in issueData"
      >
        <td>{{ issue.sitecode }}</td>
        <td>{{ issue.sitename }}</td>
        <td>
          <button
            v-bind:class="'btn status-indicator btn-xs btn-' + issue.category.toLowerCase()"
          >{{ issue.category }}</button>
        </td>
        <td>{{ issue.service }}</td>
        <td>{{ issue.datetime }}</td>
        <td>{{ issue.lastcontacted }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
  name: "IssueList",
  props: ["issueData"],
  data: function() {
    return {
      divHeight: null,
      url: "/issues"
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

<style scoped>
</style>