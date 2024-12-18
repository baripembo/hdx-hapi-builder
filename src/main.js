// import { mount } from 'svelte'
// import './app.css'
// import App from './App.svelte'

// const app = mount(App, {
//   target: document.getElementById('app'),
// })

// export default app



// src/main.js
import { mount } from 'svelte'
import './app.scss'
import App from "./App.svelte";

const urlParams = new URLSearchParams(window.location.search);
const pageType = urlParams.get("type") || "locations";
const params = Object.fromEntries(urlParams.entries());

// const app = new App({
//   target: document.body,
//   props: { pageType, params },
// });

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app;
