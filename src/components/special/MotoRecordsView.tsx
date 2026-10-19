import React from 'react';
import { VehicleMasterView } from './VehicleMasterView';

/**
 * MotoRecordsView delega en VehicleMasterView (módulo integral de vehículos, combustible,
 * odómetro, kilometraje, mantenimientos y costos consolidados).
 */
export const MotoRecordsView: React.FC = () => {
  return <VehicleMasterView />;
};
