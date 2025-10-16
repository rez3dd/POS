// src/Services/Menu.js
import { api } from "./api";

export async function getMenus() {
  const { data } = await api.get("/menus");
  return data; // [{ id, name, price, status, imageUrl, category: { id, name } }, ...]
}

export async function getMenuById(id) {
  const { data } = await api.get(`/menus/${id}`);
  return data; // { id, name, price, status, imageUrl, category: {...} }
}

export async function createMenu(payload) {
  const { data } = await api.post("/menus", payload);
  return data; // return object with category included
}

export async function updateMenu(id, payload) {
  const { data } = await api.put(`/menus/${id}`, payload);
  return data; // return updated object with category included
}

export async function resetAllMenus() {
  const { data } = await api.post("/menus/reset");
  return data;
}
