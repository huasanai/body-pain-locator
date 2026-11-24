import type { SemanticHotspot } from '@/types/anatomy';

/**
 * 混合语义热点层（标准米制 Y-up 坐标：脚底 y=0，身高 1.72m，面朝 +Z，患者左侧为 +X）
 * 作用：补足细小韧带、眼球深处及临床区域性概念（腹部九分法、太阳穴、膏肓区、半月板、足底筋膜等），
 * 确保全部 12 类高频不适部位 100% 精准可点击、零死角。
 */
export const SEMANTIC_HOTSPOTS: SemanticHotspot[] = [
  // 1. 头部
  { id: 'hotspot:head_forehead', structureKey: 'hotspot:head_forehead', regionId: 'head', layer: 'bone', laterality: 'midline', position: [0, 1.655, 0.085], radius: 0.028 },
  { id: 'hotspot:head_temple_l', structureKey: 'hotspot:head_temple_l', regionId: 'head', layer: 'muscle', laterality: 'left', position: [0.072, 1.625, 0.032], radius: 0.022 },
  { id: 'hotspot:head_temple_r', structureKey: 'hotspot:head_temple_r', regionId: 'head', layer: 'muscle', laterality: 'right', position: [-0.072, 1.625, 0.032], radius: 0.022 },
  { id: 'hotspot:head_occiput', structureKey: 'hotspot:head_occiput', regionId: 'head', layer: 'muscle', laterality: 'midline', position: [0, 1.58, -0.095], radius: 0.032 },
  { id: 'hotspot:head_vertex', structureKey: 'hotspot:head_vertex', regionId: 'head', layer: 'bone', laterality: 'midline', position: [0, 1.71, -0.005], radius: 0.032 },
  { id: 'hotspot:head_sinus', structureKey: 'hotspot:head_sinus', regionId: 'head', layer: 'bone', laterality: 'midline', position: [0, 1.6, 0.098], radius: 0.024 },
  { id: 'hotspot:head_tmj_l', structureKey: 'hotspot:head_tmj_l', regionId: 'head', layer: 'ligament', laterality: 'left', position: [0.068, 1.572, 0.022], radius: 0.02 },
  { id: 'hotspot:head_tmj_r', structureKey: 'hotspot:head_tmj_r', regionId: 'head', layer: 'ligament', laterality: 'right', position: [-0.068, 1.572, 0.022], radius: 0.02 },

  // 2. 眼部
  { id: 'hotspot:eye_orbit_l', structureKey: 'hotspot:eye_orbit_l', regionId: 'eye', layer: 'organ', laterality: 'left', position: [0.033, 1.62, 0.088], radius: 0.017, alwaysVisibleInRegion: true },
  { id: 'hotspot:eye_orbit_r', structureKey: 'hotspot:eye_orbit_r', regionId: 'eye', layer: 'organ', laterality: 'right', position: [-0.033, 1.62, 0.088], radius: 0.017, alwaysVisibleInRegion: true },
  { id: 'hotspot:eye_retro_l', structureKey: 'hotspot:eye_retro_l', regionId: 'eye', layer: 'organ', laterality: 'left', position: [0.03, 1.618, 0.056], radius: 0.018, alwaysVisibleInRegion: true },
  { id: 'hotspot:eye_retro_r', structureKey: 'hotspot:eye_retro_r', regionId: 'eye', layer: 'organ', laterality: 'right', position: [-0.03, 1.618, 0.056], radius: 0.018, alwaysVisibleInRegion: true },
  { id: 'hotspot:eye_brow', structureKey: 'hotspot:eye_brow', regionId: 'eye', layer: 'muscle', laterality: 'midline', position: [0, 1.638, 0.095], radius: 0.02 },

  // 3. 颈部
  { id: 'hotspot:neck_posterior', structureKey: 'hotspot:neck_posterior', regionId: 'neck', layer: 'bone', laterality: 'midline', position: [0, 1.47, -0.05], radius: 0.03 },
  { id: 'hotspot:neck_side_l', structureKey: 'hotspot:neck_side_l', regionId: 'neck', layer: 'muscle', laterality: 'left', position: [0.056, 1.465, 0.005], radius: 0.026 },
  { id: 'hotspot:neck_side_r', structureKey: 'hotspot:neck_side_r', regionId: 'neck', layer: 'muscle', laterality: 'right', position: [-0.056, 1.465, 0.005], radius: 0.026 },
  { id: 'hotspot:neck_anterior', structureKey: 'hotspot:neck_anterior', regionId: 'neck', layer: 'organ', laterality: 'midline', position: [0, 1.462, 0.052], radius: 0.026 },

  // 4. 肩膀
  { id: 'hotspot:shoulder_acromion_l', structureKey: 'hotspot:shoulder_acromion_l', regionId: 'shoulder', layer: 'muscle', laterality: 'left', position: [0.215, 1.405, 0.005], radius: 0.032 },
  { id: 'hotspot:shoulder_acromion_r', structureKey: 'hotspot:shoulder_acromion_r', regionId: 'shoulder', layer: 'muscle', laterality: 'right', position: [-0.215, 1.405, 0.005], radius: 0.032 },
  { id: 'hotspot:shoulder_rotator_l', structureKey: 'hotspot:shoulder_rotator_l', regionId: 'shoulder', layer: 'ligament', laterality: 'left', position: [0.185, 1.395, 0.015], radius: 0.03, alwaysVisibleInRegion: true },
  { id: 'hotspot:shoulder_rotator_r', structureKey: 'hotspot:shoulder_rotator_r', regionId: 'shoulder', layer: 'ligament', laterality: 'right', position: [-0.185, 1.395, 0.015], radius: 0.03, alwaysVisibleInRegion: true },

  // 5. 肩胛骨
  { id: 'hotspot:scapula_medial_l', structureKey: 'hotspot:scapula_medial_l', regionId: 'scapula', layer: 'muscle', laterality: 'left', position: [0.068, 1.33, -0.088], radius: 0.032, alwaysVisibleInRegion: true },
  { id: 'hotspot:scapula_medial_r', structureKey: 'hotspot:scapula_medial_r', regionId: 'scapula', layer: 'muscle', laterality: 'right', position: [-0.068, 1.33, -0.088], radius: 0.032, alwaysVisibleInRegion: true },
  { id: 'hotspot:scapula_inferior_l', structureKey: 'hotspot:scapula_inferior_l', regionId: 'scapula', layer: 'bone', laterality: 'left', position: [0.11, 1.275, -0.092], radius: 0.032 },
  { id: 'hotspot:scapula_inferior_r', structureKey: 'hotspot:scapula_inferior_r', regionId: 'scapula', layer: 'bone', laterality: 'right', position: [-0.11, 1.275, -0.092], radius: 0.032 },

  // 6. 胸口
  { id: 'hotspot:chest_retrosternal', structureKey: 'hotspot:chest_retrosternal', regionId: 'chest', layer: 'organ', laterality: 'midline', position: [0, 1.29, 0.082], radius: 0.036, alwaysVisibleInRegion: true },
  { id: 'hotspot:chest_precordial', structureKey: 'hotspot:chest_precordial', regionId: 'chest', layer: 'organ', laterality: 'left', position: [0.055, 1.265, 0.068], radius: 0.038, alwaysVisibleInRegion: true },
  { id: 'hotspot:chest_right', structureKey: 'hotspot:chest_right', regionId: 'chest', layer: 'organ', laterality: 'right', position: [-0.075, 1.28, 0.062], radius: 0.038 },
  { id: 'hotspot:chest_costal_l', structureKey: 'hotspot:chest_costal_l', regionId: 'chest', layer: 'bone', laterality: 'left', position: [0.105, 1.235, 0.088], radius: 0.032 },
  { id: 'hotspot:chest_costal_r', structureKey: 'hotspot:chest_costal_r', regionId: 'chest', layer: 'bone', laterality: 'right', position: [-0.105, 1.235, 0.088], radius: 0.032 },

  // 7. 肚子（腹部九分法关键点）
  { id: 'hotspot:abdomen_epigastric', structureKey: 'hotspot:abdomen_epigastric', regionId: 'abdomen', layer: 'organ', laterality: 'midline', position: [0, 1.155, 0.088], radius: 0.036, alwaysVisibleInRegion: true },
  { id: 'hotspot:abdomen_ruq', structureKey: 'hotspot:abdomen_ruq', regionId: 'abdomen', layer: 'organ', laterality: 'right', position: [-0.078, 1.145, 0.078], radius: 0.038, alwaysVisibleInRegion: true },
  { id: 'hotspot:abdomen_luq', structureKey: 'hotspot:abdomen_luq', regionId: 'abdomen', layer: 'organ', laterality: 'left', position: [0.078, 1.145, 0.078], radius: 0.038, alwaysVisibleInRegion: true },
  { id: 'hotspot:abdomen_umbilical', structureKey: 'hotspot:abdomen_umbilical', regionId: 'abdomen', layer: 'organ', laterality: 'midline', position: [0, 1.055, 0.095], radius: 0.036, alwaysVisibleInRegion: true },
  { id: 'hotspot:abdomen_rlq', structureKey: 'hotspot:abdomen_rlq', regionId: 'abdomen', layer: 'organ', laterality: 'right', position: [-0.075, 0.965, 0.085], radius: 0.036, alwaysVisibleInRegion: true },
  { id: 'hotspot:abdomen_llq', structureKey: 'hotspot:abdomen_llq', regionId: 'abdomen', layer: 'organ', laterality: 'left', position: [0.075, 0.965, 0.085], radius: 0.036, alwaysVisibleInRegion: true },
  { id: 'hotspot:abdomen_suprapubic', structureKey: 'hotspot:abdomen_suprapubic', regionId: 'abdomen', layer: 'organ', laterality: 'midline', position: [0, 0.925, 0.088], radius: 0.036, alwaysVisibleInRegion: true },

  // 8. 手与上肢
  { id: 'hotspot:elbow_lateral_l', structureKey: 'hotspot:elbow_lateral_l', regionId: 'upper_limb_hand', layer: 'ligament', laterality: 'left', position: [0.245, 1.105, -0.015], radius: 0.024 },
  { id: 'hotspot:elbow_lateral_r', structureKey: 'hotspot:elbow_lateral_r', regionId: 'upper_limb_hand', layer: 'ligament', laterality: 'right', position: [-0.245, 1.105, -0.015], radius: 0.024 },
  { id: 'hotspot:wrist_carpal_l', structureKey: 'hotspot:wrist_carpal_l', regionId: 'upper_limb_hand', layer: 'ligament', laterality: 'left', position: [0.285, 0.875, 0.015], radius: 0.022, alwaysVisibleInRegion: true },
  { id: 'hotspot:wrist_carpal_r', structureKey: 'hotspot:wrist_carpal_r', regionId: 'upper_limb_hand', layer: 'ligament', laterality: 'right', position: [-0.285, 0.875, 0.015], radius: 0.022 },
  { id: 'hotspot:wrist_thumb_l', structureKey: 'hotspot:wrist_thumb_l', regionId: 'upper_limb_hand', layer: 'ligament', laterality: 'left', position: [0.305, 0.858, 0.025], radius: 0.02, alwaysVisibleInRegion: true },
  { id: 'hotspot:wrist_thumb_r', structureKey: 'hotspot:wrist_thumb_r', regionId: 'upper_limb_hand', layer: 'ligament', laterality: 'right', position: [-0.305, 0.858, 0.025], radius: 0.02 },
  { id: 'hotspot:hand_fingers_l', structureKey: 'hotspot:hand_fingers_l', regionId: 'upper_limb_hand', layer: 'bone', laterality: 'left', position: [0.305, 0.78, 0.02], radius: 0.026 },
  { id: 'hotspot:hand_fingers_r', structureKey: 'hotspot:hand_fingers_r', regionId: 'upper_limb_hand', layer: 'bone', laterality: 'right', position: [-0.305, 0.78, 0.02], radius: 0.026 },

  // 9. 腰背
  { id: 'hotspot:lumbar_center', structureKey: 'hotspot:lumbar_center', regionId: 'lower_back', layer: 'bone', laterality: 'midline', position: [0, 1.03, -0.072], radius: 0.036, alwaysVisibleInRegion: true },
  { id: 'hotspot:lumbar_muscle_l', structureKey: 'hotspot:lumbar_muscle_l', regionId: 'lower_back', layer: 'muscle', laterality: 'left', position: [0.062, 1.04, -0.082], radius: 0.036 },
  { id: 'hotspot:lumbar_muscle_r', structureKey: 'hotspot:lumbar_muscle_r', regionId: 'lower_back', layer: 'muscle', laterality: 'right', position: [-0.062, 1.04, -0.082], radius: 0.036 },
  { id: 'hotspot:sacroiliac_l', structureKey: 'hotspot:sacroiliac_l', regionId: 'lower_back', layer: 'ligament', laterality: 'left', position: [0.055, 0.935, -0.082], radius: 0.03, alwaysVisibleInRegion: true },
  { id: 'hotspot:sacroiliac_r', structureKey: 'hotspot:sacroiliac_r', regionId: 'lower_back', layer: 'ligament', laterality: 'right', position: [-0.055, 0.935, -0.082], radius: 0.03, alwaysVisibleInRegion: true },
  { id: 'hotspot:kidney_flank_l', structureKey: 'hotspot:kidney_flank_l', regionId: 'lower_back', layer: 'organ', laterality: 'left', position: [0.075, 1.12, -0.068], radius: 0.032, alwaysVisibleInRegion: true },
  { id: 'hotspot:kidney_flank_r', structureKey: 'hotspot:kidney_flank_r', regionId: 'lower_back', layer: 'organ', laterality: 'right', position: [-0.075, 1.11, -0.068], radius: 0.032, alwaysVisibleInRegion: true },
  { id: 'hotspot:coccyx', structureKey: 'hotspot:coccyx', regionId: 'lower_back', layer: 'bone', laterality: 'midline', position: [0, 0.855, -0.078], radius: 0.026 },

  // 10. 膝盖前后
  { id: 'hotspot:knee_patella_l', structureKey: 'hotspot:knee_patella_l', regionId: 'knee', layer: 'bone', laterality: 'left', position: [0.095, 0.505, 0.055], radius: 0.025, alwaysVisibleInRegion: true },
  { id: 'hotspot:knee_patella_r', structureKey: 'hotspot:knee_patella_r', regionId: 'knee', layer: 'bone', laterality: 'right', position: [-0.095, 0.505, 0.055], radius: 0.025 },
  { id: 'hotspot:knee_patellar_tendon_l', structureKey: 'hotspot:knee_patellar_tendon_l', regionId: 'knee', layer: 'ligament', laterality: 'left', position: [0.095, 0.462, 0.052], radius: 0.022, alwaysVisibleInRegion: true },
  { id: 'hotspot:knee_patellar_tendon_r', structureKey: 'hotspot:knee_patellar_tendon_r', regionId: 'knee', layer: 'ligament', laterality: 'right', position: [-0.095, 0.462, 0.052], radius: 0.022 },
  { id: 'hotspot:knee_medial_l', structureKey: 'hotspot:knee_medial_l', regionId: 'knee', layer: 'ligament', laterality: 'left', position: [0.052, 0.488, 0.015], radius: 0.024, alwaysVisibleInRegion: true },
  { id: 'hotspot:knee_medial_r', structureKey: 'hotspot:knee_medial_r', regionId: 'knee', layer: 'ligament', laterality: 'right', position: [-0.052, 0.488, 0.015], radius: 0.024 },
  { id: 'hotspot:knee_lateral_l', structureKey: 'hotspot:knee_lateral_l', regionId: 'knee', layer: 'ligament', laterality: 'left', position: [0.142, 0.488, 0.012], radius: 0.024, alwaysVisibleInRegion: true },
  { id: 'hotspot:knee_lateral_r', structureKey: 'hotspot:knee_lateral_r', regionId: 'knee', layer: 'ligament', laterality: 'right', position: [-0.142, 0.488, 0.012], radius: 0.024 },
  { id: 'hotspot:knee_cruciate_l', structureKey: 'hotspot:knee_cruciate_l', regionId: 'knee', layer: 'ligament', laterality: 'left', position: [0.095, 0.49, 0.008], radius: 0.024, alwaysVisibleInRegion: true },
  { id: 'hotspot:knee_cruciate_r', structureKey: 'hotspot:knee_cruciate_r', regionId: 'knee', layer: 'ligament', laterality: 'right', position: [-0.095, 0.49, 0.008], radius: 0.024 },
  { id: 'hotspot:knee_popliteal_l', structureKey: 'hotspot:knee_popliteal_l', regionId: 'knee', layer: 'muscle', laterality: 'left', position: [0.095, 0.49, -0.048], radius: 0.028, alwaysVisibleInRegion: true },
  { id: 'hotspot:knee_popliteal_r', structureKey: 'hotspot:knee_popliteal_r', regionId: 'knee', layer: 'muscle', laterality: 'right', position: [-0.095, 0.49, -0.048], radius: 0.028 },

  // 11. 大腿与小腿
  { id: 'hotspot:hip_groin_l', structureKey: 'hotspot:hip_groin_l', regionId: 'thigh_calf', layer: 'ligament', laterality: 'left', position: [0.085, 0.855, 0.068], radius: 0.032 },
  { id: 'hotspot:hip_groin_r', structureKey: 'hotspot:hip_groin_r', regionId: 'thigh_calf', layer: 'ligament', laterality: 'right', position: [-0.085, 0.855, 0.068], radius: 0.032 },
  { id: 'hotspot:glute_piriformis_l', structureKey: 'hotspot:glute_piriformis_l', regionId: 'thigh_calf', layer: 'muscle', laterality: 'left', position: [0.095, 0.87, -0.095], radius: 0.038 },
  { id: 'hotspot:glute_piriformis_r', structureKey: 'hotspot:glute_piriformis_r', regionId: 'thigh_calf', layer: 'muscle', laterality: 'right', position: [-0.095, 0.87, -0.095], radius: 0.038 },
  { id: 'hotspot:thigh_itb_l', structureKey: 'hotspot:thigh_itb_l', regionId: 'thigh_calf', layer: 'ligament', laterality: 'left', position: [0.165, 0.69, 0.005], radius: 0.032 },
  { id: 'hotspot:thigh_itb_r', structureKey: 'hotspot:thigh_itb_r', regionId: 'thigh_calf', layer: 'ligament', laterality: 'right', position: [-0.165, 0.69, 0.005], radius: 0.032 },
  { id: 'hotspot:calf_gastroc_l', structureKey: 'hotspot:calf_gastroc_l', regionId: 'thigh_calf', layer: 'muscle', laterality: 'left', position: [0.095, 0.32, -0.058], radius: 0.036 },
  { id: 'hotspot:calf_gastroc_r', structureKey: 'hotspot:calf_gastroc_r', regionId: 'thigh_calf', layer: 'muscle', laterality: 'right', position: [-0.095, 0.32, -0.058], radius: 0.036 },

  // 12. 脚踝与足
  { id: 'hotspot:ankle_atfl_l', structureKey: 'hotspot:ankle_atfl_l', regionId: 'ankle_foot', layer: 'ligament', laterality: 'left', position: [0.132, 0.088, 0.022], radius: 0.022, alwaysVisibleInRegion: true },
  { id: 'hotspot:ankle_atfl_r', structureKey: 'hotspot:ankle_atfl_r', regionId: 'ankle_foot', layer: 'ligament', laterality: 'right', position: [-0.132, 0.088, 0.022], radius: 0.022 },
  { id: 'hotspot:ankle_deltoid_l', structureKey: 'hotspot:ankle_deltoid_l', regionId: 'ankle_foot', layer: 'ligament', laterality: 'left', position: [0.068, 0.092, 0.005], radius: 0.022, alwaysVisibleInRegion: true },
  { id: 'hotspot:ankle_deltoid_r', structureKey: 'hotspot:ankle_deltoid_r', regionId: 'ankle_foot', layer: 'ligament', laterality: 'right', position: [-0.068, 0.092, 0.005], radius: 0.022 },
  { id: 'hotspot:ankle_achilles_l', structureKey: 'hotspot:ankle_achilles_l', regionId: 'ankle_foot', layer: 'ligament', laterality: 'left', position: [0.098, 0.115, -0.042], radius: 0.022, alwaysVisibleInRegion: true },
  { id: 'hotspot:ankle_achilles_r', structureKey: 'hotspot:ankle_achilles_r', regionId: 'ankle_foot', layer: 'ligament', laterality: 'right', position: [-0.098, 0.115, -0.042], radius: 0.022 },
  { id: 'hotspot:foot_plantar_l', structureKey: 'hotspot:foot_plantar_l', regionId: 'ankle_foot', layer: 'ligament', laterality: 'left', position: [0.1, 0.015, 0.025], radius: 0.026, alwaysVisibleInRegion: true },
  { id: 'hotspot:foot_plantar_r', structureKey: 'hotspot:foot_plantar_r', regionId: 'ankle_foot', layer: 'ligament', laterality: 'right', position: [-0.1, 0.015, 0.025], radius: 0.026 },
  { id: 'hotspot:foot_bigtoe_l', structureKey: 'hotspot:foot_bigtoe_l', regionId: 'ankle_foot', layer: 'bone', laterality: 'left', position: [0.078, 0.022, 0.145], normalDir: [0, 0.6, 0.8], radius: 0.022, alwaysVisibleInRegion: true },
  { id: 'hotspot:foot_bigtoe_r', structureKey: 'hotspot:foot_bigtoe_r', regionId: 'ankle_foot', layer: 'bone', laterality: 'right', position: [-0.078, 0.022, 0.145], normalDir: [0, 0.6, 0.8], radius: 0.022 },

  // 13. 大腿后侧到腘窝（筋腱与神经专项精确锚点）
  { id: 'hotspot:post_biceps_tendon_l', structureKey: 'hotspot:post_biceps_tendon_l', regionId: 'posterior_thigh_popliteal', layer: 'tendon', laterality: 'left', position: [0.132, 0.565, -0.072], normalDir: [0.38, 0, -0.92], radius: 0.024, alwaysVisibleInRegion: true },
  { id: 'hotspot:post_biceps_tendon_r', structureKey: 'hotspot:post_biceps_tendon_r', regionId: 'posterior_thigh_popliteal', layer: 'tendon', laterality: 'right', position: [-0.132, 0.565, -0.072], normalDir: [-0.38, 0, -0.92], radius: 0.024 },
  { id: 'hotspot:post_semi_tendon_l', structureKey: 'hotspot:post_semi_tendon_l', regionId: 'posterior_thigh_popliteal', layer: 'tendon', laterality: 'left', position: [0.064, 0.565, -0.072], normalDir: [-0.32, 0, -0.94], radius: 0.024, alwaysVisibleInRegion: true },
  { id: 'hotspot:post_semi_tendon_r', structureKey: 'hotspot:post_semi_tendon_r', regionId: 'posterior_thigh_popliteal', layer: 'tendon', laterality: 'right', position: [-0.064, 0.565, -0.072], normalDir: [0.32, 0, -0.94], radius: 0.024 },
  { id: 'hotspot:post_sciatic_nerve_l', structureKey: 'hotspot:post_sciatic_nerve_l', regionId: 'posterior_thigh_popliteal', layer: 'nerve', laterality: 'left', position: [0.098, 0.68, -0.068], normalDir: [0.05, 0, -0.99], radius: 0.024, alwaysVisibleInRegion: true },
  { id: 'hotspot:post_sciatic_nerve_r', structureKey: 'hotspot:post_sciatic_nerve_r', regionId: 'posterior_thigh_popliteal', layer: 'nerve', laterality: 'right', position: [-0.098, 0.68, -0.068], normalDir: [-0.05, 0, -0.99], radius: 0.024 },
  { id: 'hotspot:post_tibial_nerve_l', structureKey: 'hotspot:post_tibial_nerve_l', regionId: 'posterior_thigh_popliteal', layer: 'nerve', laterality: 'left', position: [0.096, 0.492, -0.052], normalDir: [0.05, 0, -0.99], radius: 0.022, alwaysVisibleInRegion: true },
  { id: 'hotspot:post_fibular_nerve_l', structureKey: 'hotspot:post_fibular_nerve_l', regionId: 'posterior_thigh_popliteal', layer: 'nerve', laterality: 'left', position: [0.138, 0.478, -0.048], normalDir: [0.55, 0, -0.82], radius: 0.022, alwaysVisibleInRegion: true },
  { id: 'hotspot:post_gastroc_origin_l', structureKey: 'hotspot:post_gastroc_origin_l', regionId: 'posterior_thigh_popliteal', layer: 'tendon', laterality: 'left', position: [0.098, 0.435, -0.068], normalDir: [0.05, 0, -0.99], radius: 0.024, alwaysVisibleInRegion: true },
];
