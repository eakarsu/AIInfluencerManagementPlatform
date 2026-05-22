import React from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Megaphone, Calendar, BarChart3, FileText,
  CreditCard, Building2, Bot, Send, Eye, Swords, Trophy, Calculator,
  LogOut, Bell, Search, PieChart
} from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Influencers from './pages/Influencers';
import Campaigns from './pages/Campaigns';
import ContentCalendar from './pages/ContentCalendar';
import Analytics from './pages/Analytics';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import Brands from './pages/Brands';
import AITools from './pages/AITools';
import AdvancedAITools from './pages/AdvancedAITools';
import Outreach from './pages/Outreach';
import AudienceInsights from './pages/AudienceInsights';
import Competitors from './pages/Competitors';
import Benchmarks from './pages/Benchmarks';
import ROICalculator from './pages/ROICalculator';
import Pass5Tools from './pages/Pass5Tools';
import CustomViewsPage from './pages/CustomViewsPage';
import BrandSafetyClauseMonitor from './pages/BrandSafetyClauseMonitor';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticCampaignManagerAutonomouslyDi from './pages/CfAgenticCampaignManagerAutonomouslyDi';
import CfInfluencerLtvPredictionRecommendingL from './pages/CfInfluencerLtvPredictionRecommendingL';
import CfAudienceOverlapDetectionRecommending from './pages/CfAudienceOverlapDetectionRecommending';
import CfTrendContentCalendarAiPredictingTop from './pages/CfTrendContentCalendarAiPredictingTop';
import CfFakeFollowerDetectionScoringEngageme from './pages/CfFakeFollowerDetectionScoringEngageme';
import CfMicroInfluencerDiscoveryFlaggingEmer from './pages/CfMicroInfluencerDiscoveryFlaggingEmer';
import GapNoAudienceSegmentationAiAudiencejsI from './pages/GapNoAudienceSegmentationAiAudiencejsI';
import GapNoPerformancePredictionModel from './pages/GapNoPerformancePredictionModel';
import GapNoFakeFollowerFraudDetector from './pages/GapNoFakeFollowerFraudDetector';
import GapNoContentCalendarTrendAi from './pages/GapNoContentCalendarTrendAi';
import GapLiveSocialMediaApiIntegrationsAre from './pages/GapLiveSocialMediaApiIntegrationsAre';
import GapNoWebhookReceiversForEngagementEven from './pages/GapNoWebhookReceiversForEngagementEven';
import GapNoFileUploadForContentBriefs from './pages/GapNoFileUploadForContentBriefs';
import GapNoNotificationEngine0References from './pages/GapNoNotificationEngine0References';
import GapNoESignatureForContracts from './pages/GapNoESignatureForContracts';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

const navSections = [
  {
    title: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/influencers', label: 'Influencers', icon: Users },
      { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
      { path: '/brands', label: 'Brands', icon: Building2 },
    ]
  },
  {
    title: 'Content & Planning',
    items: [
      { path: '/content-calendar', label: 'Content Calendar', icon: Calendar },
      { path: '/outreach', label: 'Outreach', icon: Send },
    ]
  },
  {
    title: 'Finance & Legal',
    items: [
      { path: '/contracts', label: 'Contracts', icon: FileText },
      { path: '/payments', label: 'Payments', icon: CreditCard },
    ]
  },
  {
    title: 'Analytics & Insights',
    items: [
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/audience-insights', label: 'Audience Insights', icon: Eye },
      { path: '/competitors', label: 'Competitors', icon: Swords },
      { path: '/benchmarks', label: 'Benchmarks', icon: Trophy },
      { path: '/roi-calculator', label: 'ROI Calculator', icon: Calculator },
      { path: '/custom-views', label: 'Campaign Views', icon: PieChart },
      { path: '/brand-safety-clause-monitor', label: 'Brand Safety Clauses', icon: Bell },
    ]
  },
  {
    title: 'AI',
    items: [
      { path: '/ai-tools', label: 'AI Tools', icon: Bot },
      { path: '/advanced-ai', label: 'Advanced AI', icon: Bot },
    ]
  },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/influencers': 'Influencers',
  '/campaigns': 'Campaigns',
  '/content-calendar': 'Content Calendar',
  '/analytics': 'Analytics',
  '/contracts': 'Contracts',
  '/payments': 'Payments',
  '/brands': 'Brands',
  '/ai-tools': 'AI Tools',
  '/advanced-ai': 'Advanced AI',
  '/outreach': 'Outreach',
  '/audience-insights': 'Audience Insights',
  '/competitors': 'Competitors',
  '/benchmarks': 'Benchmarks',
  '/roi-calculator': 'ROI Calculator',
  '/custom-views': 'Campaign Views',
  '/brand-safety-clause-monitor': 'Brand Safety Clauses',
};

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">AI</div>
          <div>
            <h1>InfluencerAI</h1>
            <span>Management Platform</span>
          </div>
        </div>

        {navSections.map((section) => (
          <div className="sidebar-section" key={section.title}>
            <div className="sidebar-section-title">{section.title}</div>
            <ul className="sidebar-nav">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  >
                    <item.icon />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="top-header-left">
            <h2>{currentTitle}</h2>
          </div>
          <div className="top-header-right">
            <button className="btn btn-icon btn-secondary">
              <Bell size={18} />
            </button>
            <div className="header-user" onClick={() => {}}>
              <div className="header-avatar">
                {(user.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="header-user-info">
                <strong>{user.name || 'Admin'}</strong>
                <span>{user.email || 'admin@influencer.io'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Routes>
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/influencers" element={<Influencers />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/content-calendar" element={<ContentCalendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/ai-tools" element={<AITools />} />
            <Route path="/advanced-ai" element={<AdvancedAITools />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/audience-insights" element={<AudienceInsights />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/benchmarks" element={<Benchmarks />} />
            <Route path="/roi-calculator" element={<ROICalculator />} />
            <Route path="/pass5-tools" element={<Pass5Tools />} />
            <Route path="/custom-views" element={<CustomViewsPage />} />
            <Route path="/brand-safety-clause-monitor" element={<BrandSafetyClauseMonitor />} />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-campaign-manager-autonomously-di" element={<CfAgenticCampaignManagerAutonomouslyDi />} />
          <Route path="/cf-influencer-ltv-prediction-recommending-l" element={<CfInfluencerLtvPredictionRecommendingL />} />
          <Route path="/cf-audience-overlap-detection-recommending-" element={<CfAudienceOverlapDetectionRecommending />} />
          <Route path="/cf-trend-content-calendar-ai-predicting-top" element={<CfTrendContentCalendarAiPredictingTop />} />
          <Route path="/cf-fake-follower-detection-scoring-engageme" element={<CfFakeFollowerDetectionScoringEngageme />} />
          <Route path="/cf-micro-influencer-discovery-flagging-emer" element={<CfMicroInfluencerDiscoveryFlaggingEmer />} />
          <Route path="/gap-no-audience-segmentation-ai-audiencejs-i" element={<GapNoAudienceSegmentationAiAudiencejsI />} />
          <Route path="/gap-no-performance-prediction-model" element={<GapNoPerformancePredictionModel />} />
          <Route path="/gap-no-fake-follower-fraud-detector" element={<GapNoFakeFollowerFraudDetector />} />
          <Route path="/gap-no-content-calendar-trend-ai" element={<GapNoContentCalendarTrendAi />} />
          <Route path="/gap-live-social-media-api-integrations-are" element={<GapLiveSocialMediaApiIntegrationsAre />} />
          <Route path="/gap-no-webhook-receivers-for-engagement-even" element={<GapNoWebhookReceiversForEngagementEven />} />
          <Route path="/gap-no-file-upload-for-content-briefs" element={<GapNoFileUploadForContentBriefs />} />
          <Route path="/gap-no-notification-engine-0-references" element={<GapNoNotificationEngine0References />} />
          <Route path="/gap-no-e-signature-for-contracts" element={<GapNoESignatureForContracts />} />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
