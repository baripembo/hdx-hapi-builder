import { mount } from 'svelte'
import './app.scss'
import App from "./App.svelte";

const urlParams = new URLSearchParams(window.location.search);
const pageType = urlParams.get("type") || "locations";
const params = Object.fromEntries(urlParams.entries());

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app;