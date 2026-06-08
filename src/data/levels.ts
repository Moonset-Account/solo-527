import { Level } from '../types';
import { equipmentList } from './equipment';
import { reagentList } from './reagents';
import { knowledgeCardList } from './knowledgeCards';

const beaker = equipmentList.find(e => e.id === 'eq_beaker')!;
const testTube = equipmentList.find(e => e.id === 'eq_test_tube')!;
const stirringRod = equipmentList.find(e => e.id === 'eq_stirring_rod')!;
const dropper = equipmentList.find(e => e.id === 'eq_dropper')!;
const thermometer = equipmentList.find(e => e.id === 'eq_thermometer')!;
const graduatedCylinder = equipmentList.find(e => e.id === 'eq_graduated_cylinder')!;

const hcl = reagentList.find(r => r.id === 're_hcl')!;
const naoh = reagentList.find(r => r.id === 're_naoh')!;
const phenolphthalein = reagentList.find(r => r.id === 're_phenolphthalein')!;
const zn = reagentList.find(r => r.id === 're_zn')!;
const cuso4 = reagentList.find(r => r.id === 're_cuso4')!;

const kcNeutralization = knowledgeCardList.find(k => k.id === 'kc_acid_base_neutralization')!;
const kcIndicator = knowledgeCardList.find(k => k.id === 'kc_acid_base_indicator')!;
const kcMetalAcid = knowledgeCardList.find(k => k.id === 'kc_metal_acid_reaction')!;
const kcRedox = knowledgeCardList.find(k => k.id === 'kc_redox_basic')!;
const kcPrecipitation = knowledgeCardList.find(k => k.id === 'kc_precipitation_reaction')!;
const kcSolubility = knowledgeCardList.find(k => k.id === 'kc_precipitation_solubility')!;

export const levels: Level[] = [
  {
    id: 'level_acid_base_neutralization',
    name: '酸碱中和反应',
    description: '学习酸碱中和反应的基本原理，通过盐酸与氢氧化钠的反应，观察酚酞指示剂的颜色变化，理解中和反应的本质。',
    difficulty: 'easy',
    tags: ['acid_base'],
    equipment: [beaker, stirringRod, dropper, graduatedCylinder],
    reagents: [hcl, naoh, phenolphthalein],
    steps: [
      {
        id: 'step_neutral_1',
        order: 1,
        instruction: '将烧杯放置在实验台上，准备开始实验',
        action: {
          type: 'place_equipment',
          equipmentId: 'eq_beaker',
        },
        errorConditions: [
          {
            id: 'err_neutral_1_1',
            condition: '未放置烧杯就添加试剂',
            message: '请先放置烧杯再添加试剂，否则试剂会洒出',
            safetyTip: '实验操作应按步骤进行，先放置器材再添加试剂',
            severity: 'error',
          },
          {
            id: 'err_neutral_1_2',
            condition: '放置了错误的器材',
            message: '本实验需要使用烧杯作为反应容器',
            safetyTip: '根据实验要求选择合适的器材',
            severity: 'warning',
          },
        ],
        hints: ['点击烧杯将其放置到实验台上', '烧杯是本实验的主要反应容器'],
        safetyNotes: ['实验前检查烧杯是否完好无损', '确保烧杯放置稳固'],
      },
      {
        id: 'step_neutral_2',
        order: 2,
        instruction: '向量筒中倒入约50mL稀盐酸，然后倒入烧杯中',
        action: {
          type: 'add_reagent',
          reagentId: 're_hcl',
          equipmentId: 'eq_beaker',
          amount: 50,
        },
        expectedResult: {
          effects: [],
          colorFrom: '#FFFFFF',
          colorTo: '#FFFFFF',
          description: '盐酸为无色透明液体，倒入烧杯中无明显变化',
          duration: 2,
        },
        errorConditions: [
          {
            id: 'err_neutral_2_1',
            condition: '加入的盐酸量过多',
            message: '盐酸加入量过多，可能导致中和不完全或溶液溅出',
            safetyTip: '用量筒准确量取50mL盐酸，避免过量加入',
            severity: 'warning',
          },
          {
            id: 'err_neutral_2_2',
            condition: '加入的盐酸量过少',
            message: '盐酸加入量不足，可能影响实验效果',
            safetyTip: '用量筒准确量取50mL盐酸，确保用量正确',
            severity: 'warning',
          },
          {
            id: 'err_neutral_2_3',
            condition: '将盐酸加入错误的容器',
            message: '请将盐酸倒入烧杯中，不要倒入其他容器',
            safetyTip: '操作时注意核对容器标签，避免加错',
            severity: 'error',
          },
        ],
        hints: ['先用量筒量取50mL盐酸', '将量筒中的盐酸沿壁缓缓倒入烧杯中'],
        safetyNotes: ['盐酸有腐蚀性，避免接触皮肤', '倾倒时标签朝向手心，防止残液腐蚀标签', '量筒读数时视线与液面凹面最低处平齐'],
      },
      {
        id: 'step_neutral_3',
        order: 3,
        instruction: '用胶头滴管向烧杯中滴加2-3滴酚酞指示剂',
        action: {
          type: 'drop',
          reagentId: 're_phenolphthalein',
          equipmentId: 'eq_beaker',
          amount: 3,
        },
        expectedResult: {
          effects: [],
          colorFrom: '#FFFFFF',
          colorTo: '#FFFFFF',
          description: '酚酞在酸性溶液中为无色，溶液仍为无色透明',
          duration: 1,
        },
        errorConditions: [
          {
            id: 'err_neutral_3_1',
            condition: '滴加酚酞过多',
            message: '酚酞滴加过多可能影响后续颜色观察',
            safetyTip: '指示剂只需滴加2-3滴即可，不宜过多',
            severity: 'warning',
          },
          {
            id: 'err_neutral_3_2',
            condition: '滴管接触了烧杯壁',
            message: '滴管不能接触容器壁，否则会污染滴管中的试剂',
            safetyTip: '滴加时滴管应悬空竖直，不可伸入容器内部或触碰容器壁',
            severity: 'warning',
          },
        ],
        hints: ['用胶头滴管吸取酚酞指示剂', '悬空竖直滴加2-3滴酚酞到烧杯中', '观察：酚酞在酸性溶液中保持无色'],
        safetyNotes: ['滴管使用后不可倒置，防止试剂腐蚀胶头', '滴管应专管专用，不可混用'],
      },
      {
        id: 'step_neutral_4',
        order: 4,
        instruction: '缓慢向烧杯中逐滴加入氢氧化钠溶液，同时不断搅拌',
        action: {
          type: 'add_reagent',
          reagentId: 're_naoh',
          equipmentId: 'eq_beaker',
          amount: 50,
        },
        expectedResult: {
          effects: ['color_change', 'heat_release'],
          colorFrom: '#FFFFFF',
          colorTo: '#FF69B4',
          description: '随着氢氧化钠的加入，溶液由无色变为粉红色，说明溶液由酸性变为碱性，温度略有升高',
          duration: 3,
        },
        errorConditions: [
          {
            id: 'err_neutral_4_1',
            condition: '一次性倒入过多氢氧化钠',
            message: '氢氧化钠加入过快，无法准确观察中和点',
            safetyTip: '应逐滴加入氢氧化钠溶液，边加边搅拌，仔细观察颜色变化',
            severity: 'error',
          },
          {
            id: 'err_neutral_4_2',
            condition: '加入氢氧化钠时未搅拌',
            message: '未搅拌溶液导致局部浓度过高，颜色变化不均匀',
            safetyTip: '加入试剂的同时需用玻璃棒不断搅拌，使反应充分进行',
            severity: 'warning',
          },
          {
            id: 'err_neutral_4_3',
            condition: '氢氧化钠溅到皮肤上',
            message: '氢氧化钠具有强腐蚀性，接触皮肤会造成灼伤！',
            safetyTip: '操作氢氧化钠时必须佩戴手套和护目镜，若不慎沾到皮肤应立即用大量清水冲洗',
            severity: 'critical',
          },
        ],
        hints: ['用胶头滴管逐滴加入氢氧化钠溶液', '每次加一滴后搅拌，观察颜色变化', '当溶液变为粉红色且半分钟内不褪色时停止加入'],
        safetyNotes: ['氢氧化钠有强腐蚀性，操作时戴手套', '逐滴加入，边加边搅拌', '注意观察颜色变化，及时停止'],
      },
      {
        id: 'step_neutral_5',
        order: 5,
        instruction: '用玻璃棒充分搅拌烧杯中的溶液，观察颜色变化',
        action: {
          type: 'stir',
          equipmentId: 'eq_beaker',
          duration: 5,
        },
        expectedResult: {
          effects: ['color_change'],
          colorFrom: '#FFFFFF',
          colorTo: '#FF69B4',
          description: '搅拌后溶液呈现均匀的粉红色，说明氢氧化钠已过量，溶液呈碱性',
          duration: 3,
        },
        errorConditions: [
          {
            id: 'err_neutral_5_1',
            condition: '搅拌过于剧烈导致溶液溅出',
            message: '搅拌过于剧烈，溶液溅出烧杯',
            safetyTip: '搅拌时应沿同一方向轻轻转动玻璃棒，避免溶液溅出',
            severity: 'warning',
          },
          {
            id: 'err_neutral_5_2',
            condition: '玻璃棒碰撞烧杯壁过猛',
            message: '玻璃棒碰撞烧杯壁可能导致烧杯破裂',
            safetyTip: '搅拌时玻璃棒不要用力碰撞容器壁和底部',
            severity: 'error',
          },
        ],
        hints: ['用玻璃棒沿同一方向轻轻搅拌', '观察溶液是否呈现均匀的粉红色'],
        safetyNotes: ['搅拌时动作要轻柔', '玻璃棒不要碰撞烧杯壁'],
      },
      {
        id: 'step_neutral_6',
        order: 6,
        instruction: '记录实验现象：溶液由无色变为粉红色，说明酸碱发生了中和反应',
        action: {
          type: 'record',
          observation: '盐酸中加入酚酞后为无色，滴加氢氧化钠溶液后变为粉红色，说明溶液由酸性变为碱性，发生了中和反应',
        },
        errorConditions: [
          {
            id: 'err_neutral_6_1',
            condition: '记录的实验现象不准确',
            message: '请仔细观察并准确记录实验现象',
            safetyTip: '实验记录应客观准确，描述颜色变化和反应过程',
            severity: 'warning',
          },
        ],
        hints: ['记录：酚酞在酸性溶液中为无色', '记录：加入氢氧化钠后溶液变为粉红色', '结论：HCl + NaOH → NaCl + H₂O'],
        safetyNotes: ['实验记录应如实填写', '实验结束后清洗器材并归位'],
      },
    ],
    knowledgeCards: [kcNeutralization, kcIndicator],
    requiredAccuracy: 0.7,
    unlockCondition: undefined,
  },
  {
    id: 'level_metal_acid_reaction',
    name: '金属与酸反应',
    description: '学习金属与酸反应的原理，观察锌粒与稀盐酸反应产生氢气的过程，理解置换反应和氧化还原反应的概念。',
    difficulty: 'medium',
    tags: ['redox'],
    equipment: [testTube, dropper],
    reagents: [zn, hcl],
    steps: [
      {
        id: 'step_metal_1',
        order: 1,
        instruction: '将试管放置在试管架上，准备开始实验',
        action: {
          type: 'place_equipment',
          equipmentId: 'eq_test_tube',
        },
        errorConditions: [
          {
            id: 'err_metal_1_1',
            condition: '未放置试管就添加试剂',
            message: '请先放置试管再添加试剂',
            safetyTip: '实验操作应按步骤进行，先放置器材再添加试剂',
            severity: 'error',
          },
          {
            id: 'err_metal_1_2',
            condition: '试管未固定好',
            message: '试管未放置稳固，可能倾倒导致试剂泄漏',
            safetyTip: '将试管牢固地放在试管架上，确保不会倾倒',
            severity: 'warning',
          },
        ],
        hints: ['点击试管将其放置到试管架上', '确保试管放置稳固'],
        safetyNotes: ['试管口不能对着自己或他人', '检查试管是否有裂纹'],
      },
      {
        id: 'step_metal_2',
        order: 2,
        instruction: '向试管中加入少量锌粒（约3-4粒）',
        action: {
          type: 'add_reagent',
          reagentId: 're_zn',
          equipmentId: 'eq_test_tube',
          amount: 4,
        },
        expectedResult: {
          effects: [],
          description: '锌粒为银白色固体颗粒，放入试管中有金属撞击声',
          duration: 1,
        },
        errorConditions: [
          {
            id: 'err_metal_2_1',
            condition: '加入的锌粒过多',
            message: '锌粒加入过多，反应可能过于剧烈',
            safetyTip: '加入3-4粒锌粒即可，过多会导致反应过于剧烈难以控制',
            severity: 'warning',
          },
          {
            id: 'err_metal_2_2',
            condition: '加入锌粒时试管口对着人',
            message: '加入药品时试管口不能对着自己或他人',
            safetyTip: '加入固体药品时试管应横放，将药品放在管口后缓慢竖起',
            severity: 'warning',
          },
        ],
        hints: ['将试管横放，用镊子夹取锌粒放在管口', '缓慢竖起试管使锌粒滑入底部'],
        safetyNotes: ['取用锌粒时使用镊子，不可用手直接接触', '固体药品应沿管壁缓缓滑入底部'],
      },
      {
        id: 'step_metal_3',
        order: 3,
        instruction: '向试管中缓慢加入约10mL稀盐酸',
        action: {
          type: 'add_reagent',
          reagentId: 're_hcl',
          equipmentId: 'eq_test_tube',
          amount: 10,
        },
        expectedResult: {
          effects: ['bubble', 'gas_release', 'heat_release'],
          colorFrom: '#FFFFFF',
          colorTo: '#FFFFFF',
          description: '加入稀盐酸后，锌粒表面立即产生大量气泡，溶液保持无色，试管壁微微发热',
          duration: 5,
        },
        errorConditions: [
          {
            id: 'err_metal_3_1',
            condition: '加入盐酸过快',
            message: '盐酸加入过快会导致反应剧烈，气泡过多可能溅出',
            safetyTip: '应沿试管壁缓慢加入稀盐酸，控制反应速率',
            severity: 'warning',
          },
          {
            id: 'err_metal_3_2',
            condition: '加入了浓盐酸或浓硫酸',
            message: '不能使用浓酸，浓酸与金属反应可能产生有毒气体',
            safetyTip: '必须使用稀盐酸，浓硫酸与金属反应会产生二氧化硫等有毒气体',
            severity: 'critical',
          },
          {
            id: 'err_metal_3_3',
            condition: '试管口对着人',
            message: '反应产生气泡可能溅出液体，试管口不能对着人',
            safetyTip: '试管口应朝向安全方向，不可对着自己或他人',
            severity: 'error',
          },
        ],
        hints: ['沿试管壁缓慢倒入约10mL稀盐酸', '观察锌粒表面的变化', '注意：会产生大量气泡（氢气）'],
        safetyNotes: ['盐酸有腐蚀性和挥发性，在通风处操作', '试管口不可对着人', '产生的氢气不可靠近明火'],
      },
      {
        id: 'step_metal_4',
        order: 4,
        instruction: '观察反应现象：锌粒表面产生气泡，溶液逐渐变少，锌粒逐渐溶解',
        action: {
          type: 'observe',
          observation: '锌粒与稀盐酸反应产生大量气泡（氢气），锌粒逐渐溶解变小，溶液保持无色透明，反应放热使试管变热',
          duration: 10,
        },
        expectedResult: {
          effects: ['bubble', 'gas_release', 'heat_release', 'dissolve'],
          description: '锌粒表面持续产生气泡，锌粒逐渐溶解变小，试管壁发热，溶液保持无色',
          duration: 10,
        },
        errorConditions: [
          {
            id: 'err_metal_4_1',
            condition: '用明火检验产生的气体',
            message: '不能直接用明火检验产生的气体！氢气与空气混合遇明火可能爆炸！',
            safetyTip: '检验氢气时必须先收集气体验纯，确认纯净后方可点燃。不纯的氢气点燃会爆炸',
            severity: 'critical',
          },
          {
            id: 'err_metal_4_2',
            condition: '用手触摸发热的试管',
            message: '反应放热，试管温度较高，直接触摸可能烫伤',
            safetyTip: '观察反应时使用试管夹持握试管，不可用手直接触摸',
            severity: 'warning',
          },
        ],
        hints: ['观察锌粒表面的气泡', '注意试管壁的温度变化', '记录：产生的气体是氢气（H₂）'],
        safetyNotes: ['使用试管夹持握试管', '检验氢气前必须先验纯', '不可将明火靠近试管口'],
      },
      {
        id: 'step_metal_5',
        order: 5,
        instruction: '记录实验现象与结论：锌与稀盐酸发生置换反应，生成氯化锌和氢气',
        action: {
          type: 'record',
          observation: '锌粒与稀盐酸反应，产生大量气泡（H₂），锌粒逐渐溶解，溶液无色，反应放热。化学方程式：Zn + 2HCl → ZnCl₂ + H₂↑',
        },
        errorConditions: [
          {
            id: 'err_metal_5_1',
            condition: '记录的化学方程式不正确',
            message: '请检查化学方程式是否配平',
            safetyTip: '化学方程式必须配平：Zn + 2HCl → ZnCl₂ + H₂↑',
            severity: 'warning',
          },
          {
            id: 'err_metal_5_2',
            condition: '未标注气体符号',
            message: '生成物中的氢气是气体，需要标注↑符号',
            safetyTip: '生成物为气体时需标注↑，沉淀标注↓',
            severity: 'warning',
          },
        ],
        hints: ['化学方程式：Zn + 2HCl → ZnCl₂ + H₂↑', '反应类型：置换反应（也是氧化还原反应）', '锌被氧化（Zn→Zn²⁺），氢离子被还原（H⁺→H₂）'],
        safetyNotes: ['实验结束后将废液倒入指定容器', '清洗试管并归位', '氢气验纯后方可点燃'],
      },
    ],
    knowledgeCards: [kcMetalAcid, kcRedox],
    requiredAccuracy: 0.75,
    unlockCondition: 'level_acid_base_neutralization',
  },
  {
    id: 'level_precipitation_reaction',
    name: '沉淀反应',
    description: '学习沉淀反应的原理，通过硫酸铜溶液与氢氧化钠溶液的反应，观察蓝色氢氧化铜沉淀的生成，掌握溶解性规律和沉淀反应的判断方法。',
    difficulty: 'hard',
    tags: ['precipitation'],
    equipment: [beaker, stirringRod, dropper, graduatedCylinder],
    reagents: [cuso4, naoh],
    steps: [
      {
        id: 'step_precip_1',
        order: 1,
        instruction: '将烧杯放置在实验台上，准备开始实验',
        action: {
          type: 'place_equipment',
          equipmentId: 'eq_beaker',
        },
        errorConditions: [
          {
            id: 'err_precip_1_1',
            condition: '未放置烧杯就添加试剂',
            message: '请先放置烧杯再添加试剂，否则试剂会洒出',
            safetyTip: '实验操作应按步骤进行，先放置器材再添加试剂',
            severity: 'error',
          },
          {
            id: 'err_precip_1_2',
            condition: '选择了错误的容器',
            message: '本实验需要使用烧杯作为反应容器',
            safetyTip: '沉淀反应需要较大的容器以便观察沉淀',
            severity: 'warning',
          },
        ],
        hints: ['点击烧杯将其放置到实验台上', '烧杯适合观察沉淀反应'],
        safetyNotes: ['检查烧杯是否完好', '烧杯放置稳固后方可添加试剂'],
      },
      {
        id: 'step_precip_2',
        order: 2,
        instruction: '向量筒中倒入约50mL硫酸铜溶液，然后倒入烧杯中',
        action: {
          type: 'add_reagent',
          reagentId: 're_cuso4',
          equipmentId: 'eq_beaker',
          amount: 50,
        },
        expectedResult: {
          effects: [],
          colorFrom: '#FFFFFF',
          colorTo: '#1E90FF',
          description: '蓝色硫酸铜溶液倒入烧杯中，呈现均匀的蓝色透明液体',
          duration: 2,
        },
        errorConditions: [
          {
            id: 'err_precip_2_1',
            condition: '加入硫酸铜溶液量过多',
            message: '硫酸铜溶液加入过多可能导致后续沉淀反应剧烈',
            safetyTip: '用量筒准确量取50mL硫酸铜溶液',
            severity: 'warning',
          },
          {
            id: 'err_precip_2_2',
            condition: '硫酸铜溶液溅到皮肤上',
            message: '硫酸铜溶液含有铜离子，对皮肤有刺激性',
            safetyTip: '倾倒溶液时动作要缓慢，若溅到皮肤上应立即用清水冲洗',
            severity: 'warning',
          },
        ],
        hints: ['用量筒量取50mL硫酸铜溶液', '沿壁缓缓倒入烧杯中', '观察：硫酸铜溶液为蓝色透明液体'],
        safetyNotes: ['硫酸铜溶液有毒，避免接触皮肤和入口', '使用量筒时视线与液面平齐', '倾倒时标签朝向手心'],
      },
      {
        id: 'step_precip_3',
        order: 3,
        instruction: '用胶头滴管逐滴加入氢氧化钠溶液，同时轻轻搅拌',
        action: {
          type: 'add_reagent',
          reagentId: 're_naoh',
          equipmentId: 'eq_beaker',
          amount: 5,
        },
        expectedResult: {
          effects: ['precipitate', 'color_change'],
          colorFrom: '#1E90FF',
          colorTo: '#4169E1',
          description: '滴加氢氧化钠后，溶液中立即出现蓝色絮状沉淀，轻轻搅拌后沉淀悬浮在溶液中',
          duration: 3,
        },
        errorConditions: [
          {
            id: 'err_precip_3_1',
            condition: '一次性倒入过多氢氧化钠',
            message: '氢氧化钠加入过快，无法观察沉淀的逐渐形成过程',
            safetyTip: '应逐滴缓慢加入氢氧化钠溶液，观察每滴加入后的变化',
            severity: 'error',
          },
          {
            id: 'err_precip_3_2',
            condition: '加入氢氧化钠时未搅拌',
            message: '未搅拌导致氢氧化钠局部浓度过高，沉淀分布不均匀',
            safetyTip: '逐滴加入的同时需轻轻搅拌，使反应物充分接触',
            severity: 'warning',
          },
          {
            id: 'err_precip_3_3',
            condition: '氢氧化钠溅到皮肤或眼睛',
            message: '氢氧化钠具有强腐蚀性，接触皮肤或眼睛会造成严重灼伤！',
            safetyTip: '操作氢氧化钠时必须佩戴护目镜和手套，若溅到皮肤立即用大量清水冲洗',
            severity: 'critical',
          },
        ],
        hints: ['用胶头滴管逐滴加入氢氧化钠溶液', '每加一滴后轻轻搅拌', '观察：蓝色絮状沉淀（氢氧化铜）逐渐生成'],
        safetyNotes: ['氢氧化钠有强腐蚀性，必须戴手套和护目镜', '逐滴加入，边加边搅拌', '观察沉淀的颜色和状态'],
      },
      {
        id: 'step_precip_4',
        order: 4,
        instruction: '继续缓慢加入氢氧化钠溶液，直到沉淀不再增加',
        action: {
          type: 'add_reagent',
          reagentId: 're_naoh',
          equipmentId: 'eq_beaker',
          amount: 45,
        },
        expectedResult: {
          effects: ['precipitate', 'color_change'],
          colorFrom: '#4169E1',
          colorTo: '#4682B4',
          description: '随着氢氧化钠的持续加入，蓝色沉淀量逐渐增多，上层溶液蓝色变浅，最终硫酸铜完全反应，沉淀不再增加',
          duration: 5,
        },
        errorConditions: [
          {
            id: 'err_precip_4_1',
            condition: '加入过量氢氧化钠导致沉淀溶解',
            message: '氢氧化铜是两性氢氧化物，在过量强碱中会溶解！',
            safetyTip: '当沉淀量不再增加时应停止加入氢氧化钠，避免过量导致沉淀溶解',
            severity: 'error',
          },
          {
            id: 'err_precip_4_2',
            condition: '搅拌过于剧烈',
            message: '搅拌过于剧烈可能导致沉淀悬浮难以观察',
            safetyTip: '搅拌应轻柔缓慢，使沉淀自然沉降后观察',
            severity: 'warning',
          },
          {
            id: 'err_precip_4_3',
            condition: '未观察沉淀是否继续生成',
            message: '应仔细观察是否还有新的沉淀生成',
            safetyTip: '当沉淀不再增加时说明反应完全，应停止加入试剂',
            severity: 'warning',
          },
        ],
        hints: ['继续逐滴加入氢氧化钠溶液', '观察蓝色沉淀量是否还在增加', '当沉淀不再增加时，说明硫酸铜已完全反应'],
        safetyNotes: ['控制加入速度，避免过量', '观察沉淀量的变化', '沉淀不再增加时停止操作'],
      },
      {
        id: 'step_precip_5',
        order: 5,
        instruction: '用玻璃棒轻轻搅拌，静置观察沉淀的沉降',
        action: {
          type: 'stir',
          equipmentId: 'eq_beaker',
          duration: 5,
        },
        expectedResult: {
          effects: ['precipitate'],
          colorFrom: '#4682B4',
          colorTo: '#4682B4',
          description: '搅拌后静置，蓝色氢氧化铜沉淀逐渐沉降到底部，上层溶液变为无色透明',
          duration: 8,
        },
        errorConditions: [
          {
            id: 'err_precip_5_1',
            condition: '搅拌过于剧烈导致沉淀悬浮不沉降',
            message: '搅拌过于剧烈使沉淀无法沉降，影响观察效果',
            safetyTip: '轻轻搅拌后静置，让沉淀自然沉降',
            severity: 'warning',
          },
          {
            id: 'err_precip_5_2',
            condition: '未等沉淀沉降就进行下一步',
            message: '沉淀需要时间沉降，请耐心等待',
            safetyTip: '静置观察需要耐心，等上层溶液变澄清后记录现象',
            severity: 'warning',
          },
        ],
        hints: ['用玻璃棒轻轻搅拌后停止', '静置等待沉淀沉降', '观察上层溶液的颜色变化'],
        safetyNotes: ['搅拌动作要轻柔', '耐心等待沉淀沉降', '观察沉淀的颜色和状态'],
      },
      {
        id: 'step_precip_6',
        order: 6,
        instruction: '记录实验现象与结论：硫酸铜与氢氧化钠反应生成蓝色氢氧化铜沉淀',
        action: {
          type: 'record',
          observation: '硫酸铜溶液与氢氧化钠溶液反应，生成蓝色絮状沉淀氢氧化铜，上层溶液逐渐变为无色。化学方程式：CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
        },
        errorConditions: [
          {
            id: 'err_precip_6_1',
            condition: '化学方程式未配平',
            message: '请检查化学方程式是否配平正确',
            safetyTip: '配平后的方程式：CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
            severity: 'warning',
          },
          {
            id: 'err_precip_6_2',
            condition: '未标注沉淀符号',
            message: '生成物氢氧化铜是沉淀，需要标注↓符号',
            safetyTip: '生成物为沉淀时需标注↓，气体标注↑',
            severity: 'warning',
          },
          {
            id: 'err_precip_6_3',
            condition: '沉淀颜色描述错误',
            message: '氢氧化铜沉淀为蓝色，不是白色或绿色',
            safetyTip: '仔细观察并如实记录：氢氧化铜为蓝色絮状沉淀',
            severity: 'warning',
          },
        ],
        hints: ['化学方程式：CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄', '反应类型：复分解反应（也是沉淀反应）', '蓝色絮状沉淀为氢氧化铜 Cu(OH)₂'],
        safetyNotes: ['实验结束后将含铜废液倒入指定回收容器', '含铜废液不可直接倒入下水道', '清洗器材并归位'],
      },
    ],
    knowledgeCards: [kcPrecipitation, kcSolubility],
    requiredAccuracy: 0.8,
    unlockCondition: 'level_metal_acid_reaction',
  },
];
