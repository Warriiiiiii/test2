// All regions, in the order the World screen lists them. A new region is added here.
import type { RegionDef } from '../../engine/types';
import { SECT_REGION } from './sect';
import { PAGODA_REGION } from './pagoda';

export const REGIONS: RegionDef[] = [SECT_REGION, PAGODA_REGION];

/** The area every run starts in. */
export const START_AREA_ID = 'sect-grounds';
