import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/hooks/useCurrency";
import LandingPage from "./pages/LandingPage";
import ProfessionalLandingPage from "./pages/ProfessionalLandingPage";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Waitlist from "./pages/Waitlist";
import Messages from "./pages/Messages";
import Patients from "./pages/Patients";
import Professionals from "./pages/Professionals";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Reports from "./pages/Reports";
import Campaigns from "./pages/Campaigns";
import Checkin from "./pages/Checkin";
import MarketingGallery from "./pages/MarketingGallery";
import CRM from "./pages/CRM";
import TakeoverHistory from "./pages/TakeoverHistory";
import SuperAdmin from "./pages/SuperAdmin";
import Register from "./pages/Register";
import HelpCenter from "./pages/HelpCenter";
import HelpArticle from "./pages/HelpArticle";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import CaseStudies from "./pages/CaseStudies";
import About from "./pages/About";
import Compare from "./pages/Compare";
import Security from "./pages/Security";
import Status from "./pages/Status";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/lp" element={<ProfessionalLandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/users" element={<Users />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/professionals" element={<Professionals />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/checkin/:appointmentId" element={<Checkin />} />
              <Route path="/marketing" element={<MarketingGallery />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/takeover-history" element={<TakeoverHistory />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/help/:slug" element={<HelpArticle />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/about" element={<About />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/security" element={<Security />} />
              <Route path="/status" element={<Status />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </CurrencyProvider>
  </QueryClientProvider>
);

export default App;
