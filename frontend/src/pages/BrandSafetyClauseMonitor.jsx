import React, { useEffect, useState } from 'react';

export default function BrandSafetyClauseMonitor() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/brand-safety-clause-monitor').then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div>
      <h1>Brand Safety Clause Monitor</h1>
      <p>Checks creator posts for disclosure, restricted claims, and contract clause risk.</p>
      {data?.posts?.map((p) => <section key={`${p.influencer}-${p.campaign}`} className="card"><h2>{p.influencer}</h2><p>{p.action} - risk {p.clause_risk_score}</p></section>)}
    </div>
  );
}
