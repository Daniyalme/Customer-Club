import axios from "axios";
const api = axios.create({
  baseURL: "http://localhost:4000",
  headers: { "Content-Type": "application/json" },
});

export function lookupCustomer(phone) {
  return api.get(`/customers/${phone}`);
}

export function addPurchase(phone, amount, name = "") {
  return api.post(`/customers/${phone}/purchase`, { amount, name });
}

// Edit an existing purchase
export function editPurchase(purchaseId, amount) {
  return api.put(`/purchases/${purchaseId}`, { amount });
}

// Delete an existing purchase
export function deletePurchase(purchaseId) {
  return api.delete(`/purchases/${purchaseId}`);
}
