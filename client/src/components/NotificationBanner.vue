<template>
  <div class="notification-banner">
    <div class="isa-success" v-if="notifType == 'success'">
      <i class="fa fa-check"></i>
      <span>{{ notifMsg }}</span>
    </div>

    <div class="isa-warning" v-if="notifType == 'warning'">
      <i class="fa fa-warning"></i>
      <span>{{ notifMsg }}</span>
    </div>

    <div class="isa-error" v-if="notifType == 'error'">
      <i class="fa fa-times-circle"></i>
      <span>{{ notifMsg }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: ["notifType", "notifMsg"]
};
</script>

<style scoped>
@import url("//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css");

.notification-banner {
  margin-top: auto;
}

.isa-success,
.isa-warning,
.isa-error {
  padding: 0.3rem;
}
.isa-success {
  color: #4f8a10;
  background-color: #dff2bf;
}
.isa-warning {
  color: #9f6000;
  background-color: #feefb3;
}
.isa-error {
  color: #d8000c;
  background-color: #ffd2d2;
}
.isa-success i,
.isa-warning i,
.isa-error i {
  margin: 10px 22px;
  vertical-align: middle;
}

.isa-error i,
span {
  font-size: 0.8rem;
}
</style>