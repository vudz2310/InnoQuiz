import { RouterProvider } from "react-router-dom";
import router from "./router";
import { NotificationProvider, ToastContainer } from "./components/Notification";
import { ThemeProvider } from "./context/ThemeContext";
import { BlockedAccessBanner } from "./components/security/BlockedAccessBanner";

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <BlockedAccessBanner />
        <RouterProvider router={router} />
        <ToastContainer />
      </NotificationProvider>
    </ThemeProvider>
  );
}


