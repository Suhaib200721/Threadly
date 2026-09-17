import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

const CART_STORAGE_KEY = 'threadly_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
      return [];
    }
  });

  // Keep localStorage synced whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  /**
   * Add a product to cart
   * @param {Object} product - Product document
   * @param {Object} selectedColour - { name, image }
   * @param {string} selectedSize - e.g. 'M', 'L'
   * @param {number} quantity - quantity to add
   * @param {string} customName - optional custom printed name
   */
  const addToCart = (product, selectedColour, selectedSize, quantity = 1, customName = '') => {
    if (!product || !product._id) {
      return { success: false, message: 'Invalid product.' };
    }

    if (!selectedSize) {
      return { success: false, message: 'Please select a size before adding to cart.' };
    }

    if (product.stock <= 0) {
      return { success: false, message: 'Sorry, this product is out of stock.' };
    }

    const colourName = selectedColour ? selectedColour.name : (product.colours?.[0]?.name || 'Default');
    const colourImage = selectedColour ? selectedColour.image : (product.colours?.[0]?.image || '');
    const trimmedCustomName = customName ? customName.trim() : '';
    
    // Unique item key based on product ID, colour, size, and customName (if provided)
    const cartItemId = trimmedCustomName
      ? `${product._id}_${colourName}_${selectedSize}_${trimmedCustomName}`
      : `${product._id}_${colourName}_${selectedSize}`;

    let result = { success: true, message: '' };

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === cartItemId);

      if (existingIndex > -1) {
        // Item exists in cart — update quantity
        const existingItem = prevCart[existingIndex];
        const newQty = existingItem.quantity + quantity;

        if (newQty > product.stock) {
          const addedPossible = Math.max(0, product.stock - existingItem.quantity);
          if (addedPossible <= 0) {
            result = {
              success: false,
              message: `Cannot add more. You already have the maximum available stock (${product.stock}) in your cart.`,
            };
            return prevCart;
          }

          result = {
            success: true,
            message: `Added ${addedPossible} item(s) to reach maximum available stock (${product.stock}).`,
          };

          const updated = [...prevCart];
          updated[existingIndex] = {
            ...existingItem,
            quantity: product.stock,
            stock: product.stock,
          };
          return updated;
        }

        result = {
          success: true,
          message: `Updated quantity in cart (${newQty} total).`,
        };

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...existingItem,
          quantity: newQty,
          stock: product.stock,
        };
        return updated;
      } else {
        // New item in cart
        const safeQty = Math.min(quantity, product.stock);

        result = {
          success: true,
          message: trimmedCustomName
            ? `Added ${product.name} (${colourName}, Size ${selectedSize}, Custom Name: "${trimmedCustomName}") to cart!`
            : `Added ${product.name} (${colourName}, Size ${selectedSize}) to cart!`,
        };

        const newItem = {
          id: cartItemId,
          productId: product._id,
          name: product.name,
          image: colourImage,
          colour: colourName,
          size: selectedSize,
          price: product.price,
          quantity: safeQty,
          stock: product.stock,
          customName: trimmedCustomName,
        };

        return [...prevCart, newItem];
      }
    });

    return result;
  };

  /**
   * Update quantity of an existing cart item
   */
  const updateQuantity = (cartItemId, newQuantity) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === cartItemId) {
          // Clamp quantity between 1 and available stock
          const clampedQty = Math.max(1, Math.min(newQuantity, item.stock || 999));
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  /**
   * Remove a single item from cart
   */
  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  };

  /**
   * Clear all items in cart
   */
  const clearCart = () => {
    setCart([]);
  };

  // Total quantity count across all items
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Subtotal price
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Total price (can be extended with tax/shipping later)
  const totalPrice = subtotal;

  const value = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    subtotal,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartContext;
