import * as React from "react";
import ReactDOM from "react-dom";
import FloorPlan from "./FloorPlan";

const RetoolConnectedComponent = Retool.connectReactComponent(FloorPlan);
document.body.setAttribute("style", "margin: 0;");

const wrapper = document.createElement("div");
document.body.appendChild(wrapper);

const RetoolComponent = React.createElement(RetoolConnectedComponent);
ReactDOM.render(RetoolComponent, document.body.appendChild(wrapper));