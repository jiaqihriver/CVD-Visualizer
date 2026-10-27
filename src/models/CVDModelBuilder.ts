/**
 * CVDModelBuilder.ts — assembles the complete rig from procedural builders
 * and registers every part with the PartRegistry.
 */

import * as THREE from 'three';
import type { PartRegistry } from '../interaction/PartRegistry';
import { buildBaseFrame, buildFurnaceSupport } from './FrameBuilder';
import {
  buildHeatingCoil,
  buildInsulationLower,
  buildInsulationUpper,
  buildShellLower,
  buildShellUpper,
} from './FurnaceBuilder';
import {
  buildInletFlange,
  buildOutletFlange,
  buildPrecursorBoat,
  buildQuartzTube,
  buildSampleBoat,
  buildSubstrate,
} from './ReactorBuilder';
import { buildGasBottles, buildGasManifold, buildMfc } from './GasSystemBuilder';
import {
  buildExhaustScrubber,
  buildVacuumGauge,
  buildVacuumLine,
  buildVacuumPump,
} from './VacuumSystemBuilder';
import {
  buildControlCabinet,
  buildPowerController,
  buildThermocouple,
} from './ControlSystemBuilder';

export function buildCVDModel(registry: PartRegistry): THREE.Group {
  const root = new THREE.Group();
  root.name = 'cvd-rig';

  const add = (group: THREE.Group): void => {
    root.add(group);
    registry.register(group);
  };

  /* 01 · frame */
  add(buildBaseFrame());
  add(buildFurnaceSupport());

  /* 02 · furnace */
  add(buildShellLower());
  add(buildShellUpper());
  add(buildInsulationLower());
  add(buildInsulationUpper());
  add(buildHeatingCoil());

  /* 03 · reactor */
  add(buildQuartzTube());
  add(buildInletFlange());
  add(buildOutletFlange());
  add(buildPrecursorBoat());
  add(buildSampleBoat());
  add(buildSubstrate());

  /* 04 · gas delivery */
  add(buildGasBottles());
  add(buildMfc());
  add(buildGasManifold());

  /* 05 · vacuum */
  add(buildVacuumLine());
  add(buildVacuumPump());
  add(buildVacuumGauge());
  add(buildExhaustScrubber());

  /* 06 · control */
  add(buildControlCabinet());
  add(buildThermocouple());
  add(buildPowerController());

  return root;
}
