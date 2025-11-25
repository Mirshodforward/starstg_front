import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Stars/home";
import AdminPanel from "./pages/Admin/AdminPanel";
import Premium from "./pages/Premium/Premium";
import PremiumSuccess from "./pages/Premium/log/PremiumSuccess";
import PremiumError from "./pages/Premium/log/PremiumError";
import PremiumAdminPanel from "./pages/Admin/AdminPanel_premium";
import SecretSettings from "./pages/Admin/SecretSettings";




function App() {
  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/premium" element={<Premium />} />
         <Route path="/starsadmin" element={<AdminPanel/>} />
         <Route path="/premium/success" element={<PremiumSuccess />} />
          <Route path="/premium/error" element={<PremiumError />} />
          <Route path="/premiumadmin" element={<PremiumAdminPanel />} />
          <Route path="/secret" element={<SecretSettings />} />
         
        
      </Routes>

    </BrowserRouter>
  );
}

export default App;
