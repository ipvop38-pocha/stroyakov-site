export const COMMERCE_CHANGE_EVENT = "stroyakov-commerce-change";

export type StoredCartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  detail: string;
};

function parseStoredArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function readCart() {
  return parseStoredArray<StoredCartItem>("stroyakov-cart");
}

export function readFavorites() {
  return parseStoredArray<string>("stroyakov-favorites");
}

export function writeCart(items: StoredCartItem[]) {
  window.localStorage.setItem("stroyakov-cart", JSON.stringify(items));
  window.dispatchEvent(new Event(COMMERCE_CHANGE_EVENT));
}

export function writeFavorites(ids: string[]) {
  window.localStorage.setItem("stroyakov-favorites", JSON.stringify(ids));
  window.dispatchEvent(new Event(COMMERCE_CHANGE_EVENT));
}

export function clearCart() {
  window.localStorage.removeItem("stroyakov-cart");
  window.dispatchEvent(new Event(COMMERCE_CHANGE_EVENT));
}

export function readCommerceSummary() {
  const cart = readCart();
  return {
    cartCount: cart.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0),
    cartTotal: cart.reduce((sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1), 0),
    favoritesCount: readFavorites().length,
  };
}
