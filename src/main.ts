import { initOAuth } from "./auth";
import { renderUI } from "./sheets";

window.onload = () => {
    initOAuth();
    renderUI();
};
