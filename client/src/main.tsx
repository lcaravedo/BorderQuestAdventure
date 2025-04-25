import { createRoot } from "react-dom/client";
import App from "./App";
import TestPage from "./TestPage"; // Import the test page
import "./index.css";

// For testing: Change between App and TestPage to see if the issue is with the game logic
// or more fundamental React rendering issues
const RootComponent = process.env.NODE_ENV === 'test' ? TestPage : App;

// Display a loading message in the DOM before React loads
const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1e293b; color: white; font-family: sans-serif;">
      <div style="text-align: center;">
        <h1>Loading Kaya Quest Game...</h1>
        <p>If this message persists, there might be an error in the game initialization.</p>
      </div>
    </div>
  `;
}

try {
  console.log("Game initialization started...");
  // Now that we know basic React works, let's try the real game with error tracing
  createRoot(document.getElementById("root")!).render(<App />);
  console.log("React rendering completed!");
} catch (error) {
  console.error("Error initializing the game:", error);
  // Show error in the DOM
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1e293b; color: white; font-family: sans-serif;">
        <div style="text-align: center; max-width: 80%;">
          <h1>Error Loading Game</h1>
          <p>There was an error initializing the game. Please check the console for details.</p>
          <pre style="text-align: left; background: #111; padding: 1rem; overflow: auto; max-height: 50vh; border-radius: 0.5rem;">${error}</pre>
        </div>
      </div>
    `;
  }
}
