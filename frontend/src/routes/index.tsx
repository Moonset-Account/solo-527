import { component$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "~/context/auth";

export default component$(() => {
  const nav = useNavigate();
  const auth = useAuth();
  
  if (auth.isAuthenticated) {
    nav.navigate('/dashboard');
  } else {
    nav.navigate('/login');
  }
  
  return <div></div>;
});
