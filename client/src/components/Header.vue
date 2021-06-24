<template>
  <div class="row header">
    <div class="header-title col-md-3">
      <div class="header-title-text">Hastings Site Monitoring</div>
      <div class="header-date">
        Data Last Updated:
        <strong class="val" v-if="metaData">{{ metaData.lastupdated }}</strong>
      </div>
    </div>
    <NotificationBanner
      class="header-notification col-md-6"
      v-if="hasNotif"
      :notif-type="notifType"
      :notif-msg="notifMsg"
    />
    <ControlPanel class="header-control col-md-3" />
  </div>
</template>

<script>
import NotificationBanner from "./NotificationBanner";
import ControlPanel from "./ControlPanel";

export default {
  name: "Header",
  components: {
    NotificationBanner: NotificationBanner,
    ControlPanel: ControlPanel
  },
  props: ["metaData", "hasNotif", "notifType", "notifMsg"]
};
</script>

<style scoped>
.header {
  padding: 0 15px;
  margin-bottom: 1rem;
}

.header-title-text {
  font-size: 1.4rem;
  font-weight: 300;
}

.header-date {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  line-height: 1.2;
}
</style>