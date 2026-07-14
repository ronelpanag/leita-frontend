import type { PipelineStage } from '@core';

/**
 * Mirror of the backend's PipelineStageTransitions state machine
 * (Leita.Domain/Applications/PipelineStageTransitions.cs): an application
 * advances one stage at a time, can be rejected from any non-terminal stage,
 * and Hired/Rejected are terminal. Keeping the graph client-side lets the
 * board block illegal moves before they round-trip and bounce.
 */
export const STAGE_ORDER: readonly PipelineStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
];

const TRANSITIONS: Record<PipelineStage, readonly PipelineStage[]> = {
  Applied: ['Screening', 'Rejected'],
  Screening: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Hired', 'Rejected'],
  Hired: [],
  Rejected: [],
};

export function legalTargets(from: PipelineStage): readonly PipelineStage[] {
  return TRANSITIONS[from];
}

export function isLegalMove(from: PipelineStage, to: PipelineStage): boolean {
  return TRANSITIONS[from].includes(to);
}
