import { capacityResolvers } from '../models/Capacity/CapacityResolvers';
import { personResolvers } from '../models/Person/PersonResolvers';

export function getResolvers() {
    return [capacityResolvers, personResolvers];
}
