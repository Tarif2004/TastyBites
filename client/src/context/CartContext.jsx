import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const CART_KEY = "tastybites90_cart";


export const CartProvider = ({ children }) => {

  const [cartItems, setCartItems] = useState(() => {

    try {

      const savedCart =
        localStorage.getItem(CART_KEY);

      return savedCart
        ? JSON.parse(savedCart)
        : [];

    } catch (error) {

      console.error(
        "Cart restore failed:",
        error
      );

      return [];

    }

  });


  /*
    Save cart whenever it changes
  */

  useEffect(() => {

    try {

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(cartItems)
      );

    } catch (error) {

      console.error(
        "Cart save failed:",
        error
      );

    }

  }, [cartItems]);


  /*
    ADD ITEM
  */

  const addToCart = (item) => {

    setCartItems((currentItems) => {

      const existingItem =
        currentItems.find(
          (cartItem) =>
            cartItem._id === item._id
        );


      if (existingItem) {

        return currentItems.map(
          (cartItem) =>
            cartItem._id === item._id
              ? {
                  ...cartItem,
                  quantity:
                    cartItem.quantity + 1,
                }
              : cartItem
        );

      }


      return [
        ...currentItems,
        {
          _id: item._id,
          name: item.name,
          price: Number(item.price),
          image: item.image || "",
          quantity: 1,
        },
      ];

    });

  };


  /*
    INCREASE QUANTITY
  */

  const increaseQuantity = (id) => {

    setCartItems((currentItems) =>

      currentItems.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )

    );

  };


  /*
    DECREASE QUANTITY
  */

  const decreaseQuantity = (id) => {

    setCartItems((currentItems) =>

      currentItems
        .map((item) =>
          item._id === id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )

    );

  };


  /*
    REMOVE ITEM
  */

  const removeFromCart = (id) => {

    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item._id !== id
      )
    );

  };


  /*
    CLEAR CART
  */

  const clearCart = () => {

    setCartItems([]);

  };


  /*
    TOTAL ITEMS
  */

  const totalItems = useMemo(() => {

    return cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  }, [cartItems]);


  /*
    SUBTOTAL
  */

  const subtotal = useMemo(() => {

    return cartItems.reduce(
      (total, item) =>
        total +
        Number(item.price) *
        item.quantity,
      0
    );

  }, [cartItems]);


  /*
    Context value
  */

  const value = {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    subtotal,
  };


  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );

};


const useCart = () => {

  const context =
    useContext(CartContext);

  if (!context) {

    throw new Error(
      "useCart must be used inside CartProvider"
    );

  }

  return context;

};

// eslint-disable-next-line react-refresh/only-export-components
export { useCart };