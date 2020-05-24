import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const getProducts = await AsyncStorage.getItem('storageCart');
      if (getProducts) {
        setProducts(JSON.parse(getProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const findProductOnCart = products.findIndex(
        item => item.id === product.id,
      );

      // -1, indicating that no element passed the test.
      if (findProductOnCart === -1) {
        const newProduct: Product = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: Number(product.price),
          quantity: 1,
        };

        setProducts([...products, newProduct]);
      } else {
        const productOnCart = products[findProductOnCart];
        productOnCart.quantity += 1;

        setProducts(
          products.map(item =>
            item.id === productOnCart.id ? productOnCart : item,
          ),
        );
      }

      await AsyncStorage.setItem('storageCart', JSON.stringify([products]));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const findProductOnCart = products.findIndex(item => item.id === id);
      const productOnCart = products[findProductOnCart];
      productOnCart.quantity += 1;

      setProducts(
        products.map(item =>
          item.id === productOnCart.id ? productOnCart : item,
        ),
      );
      await AsyncStorage.setItem('storageCart', JSON.stringify([products]));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findProductOnCart = products.findIndex(item => item.id === id);
      const productOnCart = products[findProductOnCart];

      if (productOnCart.quantity === 1) {
        productOnCart.quantity = 1;
      } else {
        productOnCart.quantity -= 1;
      }

      setProducts(
        products.map(item =>
          item.id === productOnCart.id ? productOnCart : item,
        ),
      );

      await AsyncStorage.setItem('storageCart', JSON.stringify([products]));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
