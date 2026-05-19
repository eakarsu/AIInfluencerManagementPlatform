import React from 'react';
import CampaignPerformanceChart from '../components/CampaignPerformanceChart';
import EngagementHeatmap from '../components/EngagementHeatmap';
import CampaignBriefPDF from '../components/CampaignBriefPDF';
import MatchingRulesEditor from '../components/MatchingRulesEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px 0' }}>Campaign Views</h2>
        <p style={{ color: '#64748b', margin: 0 }}>Custom analytics, briefs, and matching rules for influencer campaigns</p>
      </div>
      <CampaignPerformanceChart />
      <EngagementHeatmap />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <CampaignBriefPDF />
        <MatchingRulesEditor />
      </div>
    </div>
  );
}
