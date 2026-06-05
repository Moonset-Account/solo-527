import { component$, Slot, useTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { useNavigate } from "@builder.io/qwik-city";
import { createAuthStore, AuthContext } from "~/context/auth";

export const useAuthLoader = routeLoader$(async () => {
  return { timestamp: Date.now() };
});

export default component$(() => {
  const auth = createAuthStore();
  
  return (
    <AuthContext.Provider value={auth}>
      <Slot />
    </AuthContext.Provider>
  );
});
