#!/usr/bin/env node
// 跨站成就一致性 2a（結算頁）：把 simulate-achievement-progress.mjs 模擬出的後台回應
// （登入、startAttempt、submitAttempt）注入各站，實際作答到提交，檢查結算頁與提交後成就頁
// 顯示的本次 EXP、正式認列、EXP 明細、答對數、本次徽章、累積 EXP／稱號／頭像是否和後台一致。
// Apps Script 請求全部由 Playwright 攔截，不連正式後台。
//
// 作答一律全對、不用提示：結算頁應顯示「後台」的數字（模擬學生有錯題與提示），
// 若前端沿用本機計算值，就會和後台不一致而被抓到。
//
// 用法：
//   BIOQUEST_WORKSPACE=../bioquest-workspace node scripts/audit-achievement-result.mjs [--units=enzymes,photosynthesis,human_nutrition] [--shots=dir]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "playwright";
import { runSimulation, DEFAULT_UNITS, RETRY_EXP_SCENARIO, prototypeDirFor } from "./simulate-achievement-progress.mjs";
import { startServer, avatarFile, VIEWPORTS } from "./audit-achievement-injection.mjs";

// ---------- 各站作答流程（全對、無提示），取自各站 tests/qa-regression.test.js ----------
const DRIVERS = {
  async enzymes(page) {
    const choice = { q01: "promote_reaction", q02: "not_consumed", q04: "not_match", q05: "optimal_temperature", q06: "not_always_hotter", q07: "acidic", q08: "activity_lower", q10: "digest_specific", q11: "protease", q12: "not_only_breakdown", q13: "not_energy", q14: "different_conditions" };
    const click = (qid) => page.locator(`[data-choice="${qid}"][data-value="${choice[qid]}"]`).click();
    await page.locator("#briefNext").click();
    await page.locator("#scanNext").click();
    for (const qid of ["q01", "q02"]) await click(qid);
    for (const [item, value] of Object.entries({ amylase: "starch", protease: "protein", lipase: "lipid" })) await page.locator(`select[data-classify-question="q03"][data-classify-item="${item}"]`).selectOption(value);
    await click("q04");
    await page.locator("#checkSection").click();
    for (const qid of ["q05", "q06", "q07", "q08"]) await click(qid);
    await page.locator("#checkSection").click();
    for (const qid of ["q10", "q11", "q12", "q13", "q14"]) await click(qid);
    await page.locator("#checkSection").click();
    await page.locator("#reviewNext").click();
    await page.locator("#submitMission").click();
  },
  async photosynthesis(page) {
    const choice = { q01: "photosynthesis", q03: "chloroplast", q04: "energy_not_reactant", q06: "oxygen", q07: "green_cells", q08: "soil_water_minerals_food_made", q10: "light_starch", q11: "strong_light_more_bubbles", q13: "plants_respire_too", q14: "oxygen_product" };
    const click = (qid) => page.locator(`[data-answer="${qid}"][data-value="${choice[qid]}"]`).click();
    const map = (qid, answers) => Promise.all(Object.entries(answers).map(([item, value]) => page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value)));
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const qid of ["q01", "q03", "q04"]) await click(qid);
    await map("q02", { carbon_dioxide: "reactant", water: "reactant_and_product", light: "energy", glucose: "product", oxygen: "product" });
    await page.locator('[data-section-next="checkpoint1"]').click();
    await map("q05", { stomata: "gas_exchange", vein: "transport", chloroplast_in_leaf: "site" });
    for (const qid of ["q06", "q07", "q08"]) await click(qid);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const qid of ["q10", "q11", "q13", "q14"]) await click(qid);
    for (const id of ["light_time", "plant_type_size", "water_amount", "temperature"]) await page.locator(`[data-toggle-set="q12"][data-value="${id}"]`).click();
    await page.locator('[data-confirm-set="q12"]').click();
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async human_nutrition(page) {
    const choice = { q03: "glands", q05: "digestion", q07: "bile", q08: "protein", q09: "small_intestine", q10: "absorb", q11: "absorb_transport", q13: "small_intestine", q14: "different" };
    const maps = {
      q01: { mouth: "tract", esophagus: "tract", stomach: "tract", small_intestine: "tract", large_intestine: "tract", salivary_gland: "gland", gastric_gland: "gland", intestinal_gland: "gland", liver: "gland", pancreas: "gland" },
      q04: { mouth: "chew", esophagus: "push", stomach: "mix", small_intestine: "absorb_nutrients", large_intestine: "absorb_water" },
      q06: { amylase: "starch", protease: "protein", lipase: "lipid" },
      q12: { starch_break: "digestion", enter_wall: "absorption", protein_break: "digestion", enter_blood: "absorption" },
    };
    const click = (qid) => page.locator(`[data-answer="${qid}"][data-value="${choice[qid]}"]`).click();
    // 每次 change 都會重繪，逐一選取
    const map = async (qid) => { for (const [item, value] of Object.entries(maps[qid])) await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value); };
    // 排序題：用「上移」按鈕把每個位置換成正確項目（每次點擊都會重繪）
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    await map("q01");
    await sequence("q02", ["mouth", "esophagus", "stomach", "small_intestine", "large_intestine", "anus"]);
    await click("q03");
    await map("q04");
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    await click("q05");
    await map("q06");
    for (const qid of ["q07", "q08"]) await click(qid);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const qid of ["q09", "q10", "q11"]) await click(qid);
    await map("q12");
    for (const qid of ["q13", "q14"]) await click(qid);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async plant_transport_structures(page) {
    const choice = { q01: "transport_structure", q02: "root_hair_absorption", q03: "continuous_vascular_bundle_system", q04: "vascular_bundle", q06: "xylem", q07: "phloem", q08: "veins_contain_vascular_bundle", q10: "transpiration_linked_to_upward_transport", q11: "material_transport", q13: "roots_water_minerals_leaves_nutrients_phloem", q14: "xylem_water_minerals_phloem_nutrients" };
    const click = (qid) => page.locator(`[data-answer="${qid}"][data-value="${choice[qid]}"]`).click();
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const qid of ["q01", "q02", "q03", "q04"]) await click(qid);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    for (const [item, value] of Object.entries({ xylem: "water_and_minerals", phloem: "photosynthetic_nutrients" })) await page.locator(`select[data-map-question="q05"][data-map-item="${item}"]`).selectOption(value);
    for (const qid of ["q06", "q07", "q08"]) await click(qid);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    await sequence("q09", ["soil_contact", "root_hair_absorption", "xylem_upward_transport", "water_reaches_leaf", "transpiration_from_stoma"]);
    for (const qid of ["q10", "q11", "q13", "q14"]) await click(qid);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async plant_material_transport(page) {
    const choice = { q01: "material_transport", q02: "root_hair_soil_contact", q04: "water_moves_up_inside", q05: "root_xylem_upward", q06: "phloem", q07: "roots_water_leaves_sugar", q08: "phloem_to_needed_parts", q10: "transpiration_transport_link", q11: "water_loss_and_gas_exchange", q12: "more_leaves_more_water_drops", q14: "xylem_water_phloem_sugar" };
    const click = (qid) => page.locator(`[data-answer="${qid}"][data-value="${choice[qid]}"]`).click();
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const qid of ["q01", "q02"]) await click(qid);
    for (const [item, value] of Object.entries({ water: "root_source", minerals: "root_source", sugar: "leaf_source" })) await page.locator(`select[data-map-question="q03"][data-map-item="${item}"]`).selectOption(value);
    await click("q04");
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    for (const qid of ["q05", "q06", "q07", "q08"]) await click(qid);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    await sequence("q09", ["soil_contact", "root_water_entry", "xylem_upward_transport", "water_reaches_leaf", "transpiration_from_stoma"]);
    for (const qid of ["q10", "q11", "q12"]) await click(qid);
    for (const value of ["plant_type_size", "leaf_area", "light_time", "temperature"]) await page.locator(`[data-toggle-set="q13"][data-value="${value}"]`).click();
    await page.locator('[data-confirm-set="q13"]').click();
    await click("q14");
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async cardiovascular_components(page) {
    const Q = (n) => `cardiovascular_components_q${String(n).padStart(2, "0")}`;
    const choice = { 1: "heart_vessels_blood", 2: "push_blood_flow", 4: "atria_receive_ventricles_push", 5: "valves_reduce_backflow", 7: "direction_not_oxygen_only", 8: "artery", 9: "capillary", 11: "red_blood_cell", 13: "heartbeat_vessel_pulse", 14: "pressure_on_vessel_wall" };
    const click = (n) => page.locator(`[data-answer="${Q(n)}"][data-value="${choice[n]}"]`).click();
    const map = async (n, answers) => { for (const [item, value] of Object.entries(answers)) await page.locator(`select[data-map-question="${Q(n)}"][data-map-item="${item}"]`).selectOption(value); };
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const n of [1, 2]) await click(n);
    await map(3, { atria: "receive_blood", ventricles: "push_blood_out", valves: "one_way_flow" });
    for (const n of [4, 5]) await click(n);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    await map(6, { artery: "away_from_heart", vein: "back_to_heart", capillary: "exchange_near_tissue" });
    for (const n of [7, 8, 9]) await click(n);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    await map(10, { plasma: "liquid_transport", red_blood_cell: "oxygen_transport", white_blood_cell: "defense", platelet: "clotting" });
    await click(11);
    await map(12, { defense_case: "white_blood_cell", wound_clotting: "platelet", liquid_environment: "plasma" });
    for (const n of [13, 14]) await click(n);
    await sequence(Q(15), ["heart_contracts", "blood_enters_vessels", "blood_components_carry", "capillary_exchange"]);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async human_circulation(page) {
    const Q = (n) => `human_circulation_q${String(n).padStart(2, "0")}`;
    const choice = { 1: "loops_back", 3: "right_lung_left", 4: "left_body_right", 5: "oxygen_up_co2_down", 6: "exchange_not_make", 7: "pulmonary_exception", 8: "lung_exchange", 9: "blood_to_tissue", 10: "tissue_to_blood", 11: "capillary", 12: "fluid_lymph_recovery", 13: "direction_route_first", 14: "systemic" };
    const click = (n) => page.locator(`[data-answer="${Q(n)}"][data-value="${choice[n]}"]`).click();
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    await click(1);
    await sequence(Q(2), ["right_ventricle", "lungs", "left_atrium", "left_ventricle", "body_tissues", "right_atrium"]);
    for (const n of [3, 4]) await click(n);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    for (const n of [5, 6, 7, 8]) await click(n);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const n of [9, 10, 11, 12, 13, 14]) await click(n);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async stimulus_response(page) {
    const Q = (n) => `stimulus_response_q${String(n).padStart(2, "0")}`;
    const choice = { 1: "bell_sound", 2: "pull_hand", 4: "movement_is_response", 5: "eye_receptor", 6: "leg_muscle", 9: "not_always_conscious", 10: "reaction_time", 11: "second_shorter", 12: "practice_possible", 13: "controlled_repeated", 14: "single_trial_caution" };
    const click = (n) => page.locator(`[data-answer="${Q(n)}"][data-value="${choice[n]}"]`).click();
    const map = async (n, answers) => {
      for (const [item, value] of Object.entries(answers)) await page.locator(`select[data-map-question="${Q(n)}"][data-map-item="${item}"]`).selectOption(value);
    };
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const n of [1, 2]) await click(n);
    await map(3, { hot_cup: "stimulus", pull_hand: "response", bright_light: "stimulus", blink: "response" });
    await click(4);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    for (const n of [5, 6]) await click(n);
    await sequence(Q(7), ["stimulus_appears", "receptor_receives", "signal_coordination", "effector_acts", "response_happens"]);
    await map(8, { food_smell: "stimulus", nose_receptor: "receptor", neck_muscle: "effector", turn_head: "response" });
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const n of [9, 10, 11, 12, 13, 14]) await click(n);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async nervous_system(page) {
    const Q = (n) => `nervous_system_q${String(n).padStart(2, "0")}`;
    const choice = { 1: "neuron_transmits_messages", 2: "neuron_cell_nerve_bundle", 4: "peripheral_nerves_connect_body_cns", 5: "sensory_neuron_to_cns", 6: "motor_neuron_to_effector", 9: "reflex_still_nervous_system", 10: "spinal_cord_cns_reflex", 11: "skull_protects_brain", 12: "brain_awareness_after_reflex", 14: "nervous_system_more_than_brain" };
    const click = (n) => page.locator(`[data-answer="${Q(n)}"][data-value="${choice[n]}"]`).click();
    const map = async (n, answers) => {
      for (const [item, value] of Object.entries(answers)) await page.locator(`select[data-map-question="${Q(n)}"][data-map-item="${item}"]`).selectOption(value);
    };
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const n of [1, 2]) await click(n);
    await map(3, { brain: "central", spinal_cord: "central", arm_nerve: "peripheral", leg_nerve: "peripheral" });
    await click(4);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    for (const n of [5, 6]) await click(n);
    await map(7, { sensory: "to_cns", interneuron: "inside_cns", motor: "to_effector" });
    await sequence(Q(8), ["skin_receptor", "sensory_to_spinal", "interneuron_spinal", "motor_to_muscle", "muscle_contract"]);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const n of [9, 10, 11, 12]) await click(n);
    await map(13, { to_cns: "sensory", inside_spinal: "interneuron", to_muscle: "motor", muscle_contract: "effector" });
    await click(14);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async endocrine_system(page) {
    const Q = (n) => `endocrine_system_q${String(n).padStart(2, "0")}`;
    const choice = { 1: "endocrine_gland_secretes_hormones", 2: "hormone_travels_in_blood", 3: "hormone_targets_specific_organs", 6: "pituitary_growth_regulation", 7: "thyroid_metabolism_growth", 8: "gonads_reproduction_development", 9: "insulin_lowers_blood_glucose", 10: "glucagon_raises_blood_glucose", 11: "insulin_data_lowers_glucose", 12: "hormones_need_balance", 13: "insulin_glucagon_opposite_directions", 14: "nerve_endocrine_different_coordination" };
    const click = (n) => page.locator(`[data-answer="${Q(n)}"][data-value="${choice[n]}"]`).click();
    const map = async (n, answers) => {
      for (const [item, value] of Object.entries(answers)) await page.locator(`select[data-map-question="${Q(n)}"][data-map-item="${item}"]`).selectOption(value);
    };
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const n of [1, 2, 3]) await click(n);
    await sequence(Q(4), ["gland_secretes", "hormone_enters_blood", "blood_transports", "target_reached", "target_responds"]);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    await map(5, { pituitary: "growth_regulation", thyroid: "metabolism_growth", pancreatic_islets: "blood_glucose", adrenal: "emergency_response" });
    for (const n of [6, 7, 8]) await click(n);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const n of [9, 10, 11, 12, 13, 14]) await click(n);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },  async behavior_sensing(page) {
    const Q = (n) => `behavior_sensing_q${String(n).padStart(2, "0")}`;
    const choice = { 1: "organisms_respond_to_stimuli", 2: "parental_behavior_reproduction", 4: "behavior_supports_survival_reproduction", 5: "taxis_whole_body_moves", 6: "taxis_not_plant_bending", 7: "phototropism_growth_direction", 9: "touch_nastic_response", 10: "sleep_movement_day_night", 11: "plants_respond_without_animal_nerves", 12: "light_affects_growth_direction", 13: "reversible_touch_response", 14: "touch_response_belongs_behavior_sensing" };
    const click = (n) => page.locator(`[data-answer="${Q(n)}"][data-value="${choice[n]}"]`).click();
    const map = async (n, answers) => {
      for (const [item, value] of Object.entries(answers)) await page.locator(`select[data-map-question="${Q(n)}"][data-map-item="${item}"]`).selectOption(value);
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const n of [1, 2]) await click(n);
    await map(3, { butterfly_nectar: "feeding", rabbit_hide_sound: "avoid_predator", peacock_display: "courtship", bird_feed_young: "parental_care" });
    await click(4);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    for (const n of [5, 6, 7]) await click(n);
    await map(8, { bug_to_dark: "taxis", stem_bends_to_window: "tropism", root_grows_down: "tropism", unicell_away_strong_light: "taxis" });
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const n of [9, 10, 11, 12, 13, 14]) await click(n);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },

};

// ---------- 各站結算頁讀值：統一成 { attemptExp, creditedExp, ledger, correct, total } ----------
// 讀不到的欄位留 null（代表該站結算頁沒有顯示，不算錯）。
const READERS = {
  enzymes: () => {
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const ledger = text.match(/完成 (\d+)｜直接答對 (\d+)｜提示後修正 (\d+)｜回報 (\d+)｜精熟 (\d+)｜再挑戰 (\d+)/);
    return {
      attemptExp: num(/本次取得 ?(\d+) EXP/),
      creditedExp: num(/本單元正式認列 ?(\d+) EXP/),
      ledger: ledger ? { completion: +ledger[1], direct: +ledger[2], revision: +ledger[3], reflection: +ledger[4], mastery: +ledger[5], retry: +ledger[6] } : null,
      ledgerTotal: null,
      correct: num(/答對 ?(\d+)\/\d+/),
      total: num(/答對 ?\d+\/(\d+)/),
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
    };
  },
  photosynthesis: () => {
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: rows["總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
    };
  },
  human_nutrition: () => {
    // 結算頁版面與第 14 站相同（ledger-grid）；本次徽章沒有 data-badge-id，改用徽章名稱對回 id
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__human_nutritionTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: rows["總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return !img || !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
  plant_transport_structures: () => {
    // 結算頁 ledger-grid；明細最後兩列是「正式認列總計」「正式認列／累積增量」，標示為正式認列，不當作本次總計比對
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__plant_transport_structuresTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return !img || !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
  plant_material_transport: () => {
    // 版面同第 16 站
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__plant_material_transportTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return !img || !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
  cardiovascular_components: () => {
    // 版面同第 16、17 站
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__cardiovascular_componentsTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return img && !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
  human_circulation: () => {
    // 版面同第 16–18 站
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__human_circulationTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return img && !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
  stimulus_response: () => {
    // 版面同第 16–19 站
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__stimulus_responseTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return img && !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
  nervous_system: () => {
    // 版面同第 16–20 站
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__nervous_systemTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return img && !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
  endocrine_system: () => {
    // 版面同第 16–21 站
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__endocrine_systemTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return img && !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },  behavior_sensing: () => {
    // 版面同第 16–22 站
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__behavior_sensingTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return img && !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
};

export const RESULT_UNITS = Object.keys(DRIVERS);

function expectedFromSubmit(res) {
  const v = res.verified_attempt;
  return {
    attemptExp: Math.min(500, v.attempt_total_exp),
    creditedExp: res.unit_credited_exp,
    ledger: { completion: v.completion_exp, direct: v.concept_exp, revision: v.revision_exp, reflection: v.question_exp, mastery: v.mastery_exp, retry: v.retry_exp },
    correct: v.correct,
    total: v.total_questions,
    badges: v.badges || [],
  };
}

const LEDGER_LABELS = { completion: "完成", direct: "直接答對", revision: "提示後修正", reflection: "回報", mastery: "精熟", retry: "再挑戰補分" };

async function auditStep(browser, baseUrl, step, viewport, shotsDir, mutateSubmit) {
  const where = `${step.unit_id}#${step.scenario}${step.step}@${viewport.width}`;
  const failures = [];
  const notes = [];
  const fail = (message) => failures.push({ where, message });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  const imageErrors = [];
  const actions = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (msg) => { if (msg.type() === "error" && !/Failed to load resource/.test(msg.text())) pageErrors.push(`console: ${msg.text()}`); });
  page.on("response", (res) => { if (res.request().resourceType() === "image" && res.status() >= 400) imageErrors.push(new URL(res.url()).pathname); });
  page.on("dialog", (dialog) => dialog.accept());
  const submitBody = mutateSubmit(structuredClone(step.submit_response));
  await page.route("**/macros/s/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let action = url.searchParams.get("action") || "";
    if (!action) { try { action = JSON.parse(request.postData() || "{}").action || ""; } catch { action = ""; } }
    actions.push(action);
    const body = action === "getStudentAndAttemptStatus" ? step.login_response_before
      : action === "startAttempt" ? step.start_response
        : action === "submitAttempt" ? submitBody
          : action === "hintEvent" ? { ok: true }
            : { ok: false, error: "blocked_in_audit" };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  try {
    await page.goto(`${baseUrl}/${prototypeDirFor(step.unit_id)}/index.html`, { waitUntil: "domcontentloaded" });
    const input = page.locator("#studentIdInput, #studentId").first();
    await input.waitFor({ timeout: 8000 });
    await input.fill(step.login_response_before.student.student_id);
    await page.locator("#loginButton, #loginBtn").first().click();
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief", null, { timeout: 8000 });
    await DRIVERS[step.unit_id](page);
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result", null, { timeout: 10000 });
    if (!actions.includes("submitAttempt")) fail("提交時沒有呼叫後台 submitAttempt");
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll("#screen img")) img.loading = "eager";
      await Promise.all([...document.querySelectorAll("#screen img")].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 3000); }))));
    });
    // 部分站用 smooth 捲動回頁首：最多等 2.5 秒讓捲動停下再量
    await page.waitForFunction(() => Math.round(scrollY + (document.querySelector("#screen")?.scrollTop || 0)) <= 2, null, { timeout: 2500 }).catch(() => {});
    const shown = await page.evaluate(READERS[step.unit_id]);
    const dom = await page.evaluate(() => ({
      badges: [...document.querySelectorAll("#screen [data-result-earned-badges] [data-badge-id]")].map((el) => el.dataset.badgeId),
      badgeImagesBroken: [...document.querySelectorAll("#screen [data-result-earned-badges] [data-badge-id]")].filter((el) => { const img = el.querySelector("img"); return !img || !(img.complete && img.naturalWidth > 0); }).map((el) => el.dataset.badgeId),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      scrollY: Math.round(scrollY + (document.querySelector("#screen")?.scrollTop || 0)),
    }));
    // 沒有 data-badge-id 的站由 READERS 自行回報本次徽章
    if (shown.badges) { dom.badges = shown.badges; dom.badgeImagesBroken = shown.badgeImagesBroken || []; }
    // 預期值一律取模擬後台的原始回應（mutateSubmit 只竄改注入頁面的資料，供自我驗證）
    const want = expectedFromSubmit(step.submit_response);
    if (!shown.verifiedNotice) fail("結算頁沒有顯示「後台已回傳正式認列資料」");
    if (shown.attemptExp !== want.attemptExp) fail(`本次取得顯示 ${shown.attemptExp ?? "（無）"} EXP，後台 attempt_total_exp=${want.attemptExp}`);
    if (shown.creditedExp !== want.creditedExp) fail(`本單元正式認列顯示 ${shown.creditedExp ?? "（無）"} EXP，後台 unit_credited_exp=${want.creditedExp}`);
    if (!shown.ledger) fail("結算頁沒有 EXP 明細");
    else for (const key of Object.keys(want.ledger)) {
      if (shown.ledger[key] !== want.ledger[key]) fail(`EXP 明細「${LEDGER_LABELS[key]}」顯示 ${shown.ledger[key] ?? "（無）"}，後台 ${want.ledger[key]}`);
    }
    if (shown.ledgerTotal != null && shown.ledgerTotal !== want.attemptExp) {
      notes.push({ where, message: `EXP 明細「總計」顯示 ${shown.ledgerTotal}（= 本單元正式認列），但各項加總是本次 ${want.attemptExp}；退步再挑戰時兩者不同，容易誤讀` });
    }
    if (shown.officialTotal != null && shown.officialTotal !== want.creditedExp) fail(`EXP 明細「正式認列總計」顯示 ${shown.officialTotal}，後台 unit_credited_exp=${want.creditedExp}`);
    if (shown.correct != null && shown.correct !== want.correct) fail(`答對顯示 ${shown.correct}，後台 correct=${want.correct}`);
    if (shown.total != null && shown.total !== want.total) fail(`題數顯示 ${shown.total}，後台 total_questions=${want.total}`);
    const missing = want.badges.filter((b) => !dom.badges.includes(b));
    const extra = dom.badges.filter((b) => !want.badges.includes(b));
    if (missing.length) fail(`本次徽章少顯示 ${missing.length} 枚：${missing.join(", ")}`);
    if (extra.length) fail(`本次徽章多顯示 ${extra.length} 枚（後台沒給）：${extra.join(", ")}`);
    if (dom.badgeImagesBroken.length) fail(`本次徽章圖片未載入：${dom.badgeImagesBroken.join(", ")}`);
    if (dom.overflow) fail("結算頁有橫向捲動");
    if (dom.scrollY > 2) fail(`結算頁沒有回到頁首（捲動 ${dom.scrollY}px）`);
    if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${where.replace(/[#@]/g, "-")}-result.png`), fullPage: true });

    // 提交後成就頁：累積 EXP、完成站數、稱號、頭像、本站總覽格
    const nav = page.locator("[data-nav='achievements']");
    if (await nav.isDisabled()) fail("提交後成就頁仍鎖住");
    else {
      await nav.click();
      await page.waitForSelector("[data-bq-badge-overview]", { timeout: 8000 });
      await page.evaluate(async () => {
        for (const img of document.querySelectorAll("#screen img")) img.loading = "eager";
        await Promise.all([...document.querySelectorAll("#screen img")].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 3000); }))));
      });
      const ach = await page.evaluate((unitId) => {
        const screen = document.querySelector("#screen");
        const avatar = screen.querySelector(".bq-title-avatar-card img, .title-avatar-card.achievements img");
        const box = screen.querySelector(`.bq-unit-badge-summary[data-unit-id="${unitId}"]`);
        return {
          text: screen.textContent.replace(/\s+/g, " "),
          avatarSrc: avatar ? (avatar.currentSrc || avatar.src) : "",
          boxCount: box?.querySelector(".bq-unit-badge-summary__head span")?.textContent.trim() || "",
          boxThumbs: box ? box.querySelectorAll("img.bq-unit-badge-thumb").length : -1,
          boxLoaded: box ? [...box.querySelectorAll("img.bq-unit-badge-thumb")].filter((img) => !img.hidden && img.naturalWidth > 0).length : -1,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      }, step.unit_id);
      const sp = step.submit_response.student_progress;
      if (!ach.text.includes(`${sp.total_exp} EXP`)) fail(`提交後成就頁沒有顯示累積 ${sp.total_exp} EXP`);
      if (!ach.text.includes(`已完成 ${sp.completed_unit_count} 站`)) fail(`提交後成就頁沒有顯示「已完成 ${sp.completed_unit_count} 站」`);
      if (!ach.text.includes(sp.current_title)) fail(`提交後成就頁沒有顯示稱號「${sp.current_title}」`);
      const wantAvatar = avatarFile(sp.title_avatar_path);
      if (avatarFile(ach.avatarSrc) !== wantAvatar) fail(`提交後稱號頭像=${avatarFile(ach.avatarSrc) || "（無）"}，後台 ${wantAvatar}`);
      const unit = JSON.parse(sp.unit_badge_summary_json || "[]").find((u) => u.unit_id === step.unit_id);
      if (!unit) fail("後台 unit_badge_summary_json 沒有本站");
      else {
        if (!ach.boxCount.startsWith(`${unit.earned_count}/`)) fail(`提交後總覽本站顯示 ${ach.boxCount || "（無）"}，後台 earned_count=${unit.earned_count}`);
        if (ach.boxThumbs !== unit.earned_count) fail(`提交後總覽本站縮圖 ${ach.boxThumbs} 張，後台 earned_count=${unit.earned_count}（可顯示圖片 ${unit.earned_badges.length} 枚）`);
        else if (ach.boxLoaded !== ach.boxThumbs) fail(`提交後總覽本站有 ${ach.boxThumbs - ach.boxLoaded} 張縮圖未載入`);
      }
      if (ach.overflow) fail("提交後成就頁有橫向捲動");
      if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${where.replace(/[#@]/g, "-")}-achievements.png`), fullPage: true });
    }
    if (pageErrors.length) fail(`頁面錯誤：${pageErrors.slice(0, 3).join(" / ")}`);
    if (imageErrors.length) fail(`圖片 404：${[...new Set(imageErrors)].slice(0, 4).join(", ")}`);
    const unexpected = actions.filter((a) => !["getStudentAndAttemptStatus", "startAttempt", "submitAttempt", "hintEvent"].includes(a));
    if (unexpected.length) fail(`呼叫了預期外的後台動作：${[...new Set(unexpected)].join(", ")}`);
  } catch (error) {
    const screen = await page.evaluate(() => document.querySelector("#screen")?.dataset.bioquestScreen || "").catch(() => "");
    fail(`流程中斷（畫面 ${screen || "?"}）：${error.message.split("\n")[0]}`);
  } finally {
    await context.close();
  }
  return { failures, notes };
}

// scenarios：main = 一般三次情境（首次有錯與提示、再挑戰全對、再挑戰退步），retry = 再挑戰有 retry_exp。
export async function runResultAudit({ units = RESULT_UNITS, viewports = VIEWPORTS, retryViewports = [VIEWPORTS[0]], scenarios = ["main", "retry"], shotsDir = "", mutateSubmit = (r) => r } = {}) {
  const unknown = units.filter((u) => !DRIVERS[u]);
  if (unknown.length) throw new Error(`這些站還沒有作答流程：${unknown.join(", ")}`);
  const plans = [];
  if (scenarios.includes("main")) {
    // 模擬第 1–15 站（加上要檢查的後續站）完整累積，取目標站的步驟（登入前已有前面各站的進度）
    const sim = runSimulation({ units: [...DEFAULT_UNITS, ...units.filter((u) => !DEFAULT_UNITS.includes(u))] });
    if (sim.skipped) return sim;
    for (const s of sim.steps.filter((x) => units.includes(x.unit_id))) plans.push({ step: { ...s, scenario: "" }, viewports });
  }
  if (scenarios.includes("retry")) {
    const sim = runSimulation({ units, scenario: RETRY_EXP_SCENARIO });
    if (sim.skipped) return sim;
    for (const s of sim.steps) plans.push({ step: { ...s, scenario: "r" }, viewports: retryViewports });
  }
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
  const { server, port } = await startServer();
  const browser = await playwright.chromium.launch({ headless: true, ...(process.env.BIOQUEST_CHROME_PATH ? { executablePath: process.env.BIOQUEST_CHROME_PATH } : {}) });
  const failures = [];
  const notes = [];
  const checked = [];
  try {
    for (const { step, viewports: vps } of plans) {
      for (const viewport of vps) {
        const out = await auditStep(browser, `http://127.0.0.1:${port}`, step, viewport, shotsDir, mutateSubmit);
        failures.push(...out.failures);
        notes.push(...out.notes);
        checked.push({ where: `${step.unit_id}#${step.scenario}${step.step}@${viewport.width}`, label: step.label, retry_exp: step.submit_response.verified_attempt.retry_exp });
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  return { skipped: false, units, checked, failures, notes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
  const result = await runResultAudit({ units: args.units ? args.units.split(",") : RESULT_UNITS, shotsDir: args.shots || "" });
  if (result.skipped) { console.log(`略過：${result.reason}`); process.exit(0); }
  console.log(`檢查 ${result.checked.length} 次提交（站 × 情境 × 視窗）`);
  result.checked.forEach((c) => console.log(`  ${c.where}  ${c.label}  retry_exp=${c.retry_exp}`));
  result.notes.forEach((n) => console.log(`備註 [${n.where}] ${n.message}`));
  if (!result.failures.length) { console.log("結算頁與提交後成就頁顯示和後台模擬全部一致"); process.exit(0); }
  console.log(`\n不一致 ${result.failures.length} 項：`);
  result.failures.forEach((f) => console.log(`- [${f.where}] ${f.message}`));
  process.exit(1);
}
