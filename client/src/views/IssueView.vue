<template>
  <div class="issue-view col-md-12">
    <IssueListExpanded :issue-data="issueData" />
    <div class="issues-bottom">
      <btn v-on:click.native="$router.push(defaultViewUrl)" v-html="close" />
    </div>
  </div>
</template>

<script>
import IssueListExpanded from "../components/IssueListExpanded";
import Btn from "../components/Btn";

export default {
  name: "IssueView",
  props: ["issueData"],
  components: {
    IssueListExpanded: IssueListExpanded,
    Btn: Btn
  },
  data: function() {
    return {
      defaultViewUrl: "/",
      close: "&#215;"
    };
  }
};
</script>

<style>
.issues-bottom {
  text-align: center;
}
</style>