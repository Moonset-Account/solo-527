import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Suspense>
      <div class="app-container">
        <slot />
      </div>
    </Suspense>
  );
}
