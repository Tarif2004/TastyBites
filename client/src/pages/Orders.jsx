import { Navigate } from "react-router-dom";

/*
  /orders redirects to /my-orders for consistency.
*/

const Orders = () => {
  return <Navigate to="/my-orders" replace />;
};

export default Orders;