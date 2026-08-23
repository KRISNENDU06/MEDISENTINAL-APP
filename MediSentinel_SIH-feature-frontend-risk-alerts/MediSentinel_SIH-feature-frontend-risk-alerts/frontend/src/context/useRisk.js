import { useContext } from 'react';
import { RiskContext } from './riskContextValue';

export function useRisk() {
  const context = useContext(RiskContext);
  if (!context) throw new Error('useRisk must be used within a RiskProvider');
  return context;
}
