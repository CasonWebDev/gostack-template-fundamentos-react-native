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
      const storagedProducts = await AsyncStorage.getItem(
        'GoMarketPlace:products',
      );

      setProducts(JSON.parse(storagedProducts ?? '[]'));
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const ProductIndex = products.findIndex(prod => prod.id === id);
      const newProductsList = [...products];
      newProductsList[ProductIndex].quantity += 1;

      await AsyncStorage.setItem(
        'GoMarketPlace:products',
        JSON.stringify(newProductsList),
      );

      setProducts(newProductsList);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const ProductIndex = products.findIndex(prod => prod.id === id);
      const newProductsList = [...products];
      newProductsList[ProductIndex].quantity -= 1;

      if (newProductsList[ProductIndex].quantity <= 0) {
        newProductsList.splice(ProductIndex, 1);
      }

      await AsyncStorage.setItem(
        'GoMarketPlace:products',
        JSON.stringify(newProductsList),
      );

      setProducts(newProductsList);
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const ProductIndex = products.findIndex(prod => prod.id === product.id);

      if (ProductIndex >= 0) {
        increment(products[ProductIndex].id);
      } else {
        const prod = product;
        prod.quantity = 1;
        const newProductsList: Product[] = [...products, prod];

        await AsyncStorage.setItem(
          'GoMarketPlace:products',
          JSON.stringify(newProductsList),
        );

        setProducts(newProductsList);
      }
    },
    [products, increment],
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
