// src/lib/store.js
import { writable } from "svelte/store";

export const loadingMessage = writable("");
export const pageInfo = writable({});
