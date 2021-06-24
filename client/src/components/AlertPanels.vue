<template>
  <div class="row">
    <div class="container col-lg-3">
      <div class="panel">
        <div
          class="panel-body panel-alert status-critical"
          v-bind:class="{ 'panel-active': metaData.criticals > 0 }"
        >
          <div class="panel-text">
            <h1>{{ metaData.criticals }}</h1>
            <div class="text-size-small">Critical issues</div>
          </div>
        </div>
      </div>
    </div>
    <div class="container col-lg-3">
      <div class="panel">
        <div
          class="panel-body panel-alert status-major"
          v-bind:class="{ 'panel-active': metaData.majors > 0 }"
        >
          <div class="panel-text">
            <h1>{{ metaData.majors }}</h1>
            <div class="text-size-small">Major issues</div>
          </div>
        </div>
      </div>
    </div>
    <div class="container col-lg-3">
      <div class="panel">
        <div
          class="panel-body panel-alert status-minor"
          v-bind:class="{ 'panel-active': metaData.minors > 0 }"
        >
          <div class="panel-text">
            <h1>{{ metaData.minors }}</h1>
            <div class="text-size-small">Minor issues</div>
          </div>
        </div>
      </div>
    </div>
    <div class="container col-lg-3">
      <div class="panel">
        <div
          class="panel-body panel-count status-overall"
          v-bind:class="{ 'panel-active': metaData.sitesup === metaData.sitecount }"
        >
          <div class="panel-text">
            <h1>{{ [metaData.sitesup, metaData.sitecount].join("/") }}</h1>
            <div class="text-size-small">Sites OK</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AlertPanels",
  props: ["metaData"]
};
</script>
 
 <style>
</style>