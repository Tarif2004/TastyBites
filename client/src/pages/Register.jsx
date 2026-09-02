import { Navigate } from "react-router-dom";

/*
  /register redirects to /signup.
  The Signup page is the real registration page.
*/

const Register = () => {
  return <Navigate to="/signup" replace />;
};

export default Register;