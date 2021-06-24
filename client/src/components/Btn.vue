<template>
  <button class="collapse-btn btn button" v-html="content"></button>
</template>

<script>
export default {
  name: "Btn",
  props: ["content"]
};
</script>

<style scoped>
.button {
  border: none;
  background-color: rgb(57, 60, 68);
  font-size: 1rem;
  font-weight: 500;
  color: #fff;
  padding: 0.3rem 0.7rem;
}

.button:hover {
  color: hsla(0, 0%, 100%, 0.5);
}
</style>