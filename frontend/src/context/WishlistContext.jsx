import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const { isLoggedIn, token } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Fetch wishlist from backend
  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setWishlist([]);
      return;
    }
    try {
      setLoadingWishlist(true);
      const res = await api.get('/wishlist');
      if (res.data && res.data.wishlist) {
        setWishlist(res.data.wishlist);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoadingWishlist(false);
    }
  }, [token]);

  // Keep wishlist updated when auth state changes
  useEffect(() => {
    if (isLoggedIn && token) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [isLoggedIn, token, fetchWishlist]);

  // Check if product ID is in wishlist
  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlist.some(
        (item) => item.product && (item.product._id === productId || item.product === productId)
      );
    },
    [wishlist]
  );

  // Add product to wishlist
  const addToWishlist = async (productId) => {
    if (!token) {
      return { success: false, message: 'Please login to save products.' };
    }
    try {
      const res = await api.post(`/wishlist/${productId}`);
      if (res.data.success) {
        await fetchWishlist(); // Refresh full wishlist
        return { success: true, message: res.data.message || 'Added to Wishlist' };
      }
      return { success: false, message: res.data.message || 'Failed to add to wishlist.' };
    } catch (err) {
      console.error('Add to wishlist error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to add to wishlist.',
      };
    }
  };

  // Remove product from wishlist
  const removeFromWishlist = async (productId) => {
    if (!token) {
      return { success: false, message: 'Please login to modify wishlist.' };
    }
    try {
      const res = await api.delete(`/wishlist/${productId}`);
      if (res.data.success) {
        // Optimistically remove from state
        setWishlist((prev) =>
          prev.filter((item) => item.product && item.product._id !== productId && item.product !== productId)
        );
        return { success: true, message: 'Removed from Wishlist' };
      }
      return { success: false, message: res.data.message || 'Failed to remove.' };
    } catch (err) {
      console.error('Remove from wishlist error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to remove from wishlist.',
      };
    }
  };

  // Toggle wishlist state
  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const totalWishlist = wishlist.length;

  const value = {
    wishlist,
    totalWishlist,
    loadingWishlist,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export default WishlistContext;
