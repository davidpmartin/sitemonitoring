import DefaultView from "../views/DefaultView";
import IssueView from "../views/IssueView";
import EventView from "../views/EventView";

export default [
  {
    path: "/",
    component: DefaultView
  },
  {
    path: "/issues",
    component: IssueView
  },
  {
    path: "/events",
    component: EventView
  }
];
