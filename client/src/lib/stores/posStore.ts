import { create } from 'zustand';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface POSState {
  currentTable: string | null;
  customerId: string | null;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  cart: CartItem[];
  setCurrentTable: (tableId: string | null) => void;
  setCustomer: (customerId: string | null) => void;
  setOrderType: (type: 'dine-in' | 'takeaway' | 'delivery') => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeFromCart: (menuItemId: string) => void;
  updateItemNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  getCartTotal: () => { subtotal: number; tax: number; total: number };
}

export const usePOSStore = create<POSState>((set, get) => ({
  currentTable: null,
  customerId: null,
  orderType: 'dine-in',
  cart: [],

  setCurrentTable: (tableId) => set({ currentTable: tableId }),
  setCustomer: (customerId) => set({ customerId }),
  setOrderType: (orderType) => set({ orderType }),

  addToCart: (item) => {
    const { cart } = get();
    const existing = cart.find((i) => i.menuItemId === item.menuItemId);
    
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }] });
    }
  },

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(menuItemId);
      return;
    }
    
    set({
      cart: get().cart.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      ),
    });
  },

  removeFromCart: (menuItemId) => {
    set({ cart: get().cart.filter((i) => i.menuItemId !== menuItemId) });
  },

  updateItemNotes: (menuItemId, notes) => {
    set({
      cart: get().cart.map((i) =>
        i.menuItemId === menuItemId ? { ...i, notes } : i
      ),
    });
  },

  clearCart: () => {
    set({
      cart: [],
      currentTable: null,
      customerId: null,
    });
  },

  getCartTotal: () => {
    const { cart } = get();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.18; // 18% tax
    return { subtotal, tax, total: subtotal + tax };
  },
}));

interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  activeModal: string | null;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  activeModal: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => {
    document.body.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));