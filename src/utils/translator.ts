import type { AnatomicalLayer, Laterality, RegionId } from '@/types/anatomy';

const PHRASE_DICT: Array<[RegExp, string]> = [
  [/\blinea alba\b/gi, '腹白线（腹中线腱膜）'],
  [/\binvesting abdominal fascia\b/gi, '腹壁浅筋膜'],
  [/\btransversalis fascia\b/gi, '腹横筋膜'],
  [/\bpectoralis major\b/gi, '胸大肌'],
  [/\bpectoralis minor\b/gi, '胸小肌'],
  [/\bpectoral\b/gi, '胸部'],
  [/\bexternal oblique\b/gi, '腹外斜肌'],
  [/\binternal oblique\b/gi, '腹内斜肌'],
  [/\btransversus abdominis\b/gi, '腹横肌'],
  [/\brectus abdominis\b/gi, '腹直肌'],
  [/\bserratus anterior\b/gi, '前锯肌'],
  [/\blatissimus dorsi\b/gi, '背阔肌'],
  [/\berector spinae\b/gi, '竖脊肌'],
  [/\bquadratus lumborum\b/gi, '腰方肌'],
  [/\btrapezius\b/gi, '斜方肌'],
  [/\bsternocleidomastoid\b/gi, '胸锁乳突肌'],
  [/\blevator scapulae\b/gi, '肩胛提肌'],
  [/\brhomboid major\b/gi, '大菱形肌'],
  [/\brhomboid minor\b/gi, '小菱形肌'],
  [/\bsupraspinatus\b/gi, '冈上肌'],
  [/\binfraspinatus\b/gi, '冈下肌'],
  [/\bsubscapularis\b/gi, '肩胛下肌'],
  [/\bteres major\b/gi, '大圆肌'],
  [/\bteres minor\b/gi, '小圆肌'],
  [/\bdeltoid\b/gi, '三角肌'],
  [/\bbiceps brachii\b/gi, '肱二头肌'],
  [/\btriceps brachii\b/gi, '肱三头肌'],
  [/\bbrachialis\b/gi, '肱肌'],
  [/\bbrachioradialis\b/gi, '肱桡肌'],
  [/\bgluteus maximus\b/gi, '臀大肌'],
  [/\bgluteus medius\b/gi, '臀中肌'],
  [/\bgluteus minimus\b/gi, '臀小肌'],
  [/\bpiriformis\b/gi, '梨状肌'],
  [/\bsartorius\b/gi, '缝匠肌'],
  [/\biliopsoas\b/gi, '髂腰肌'],
  [/\bpsoas major\b/gi, '腰大肌'],
  [/\biliacus\b/gi, '髂肌'],
  [/\brectus femoris\b/gi, '股直肌'],
  [/\bvastus lateralis\b/gi, '股外侧肌'],
  [/\bvastus medialis\b/gi, '股内侧肌'],
  [/\bvastus intermedius\b/gi, '股中间肌'],
  [/\bbiceps femoris\b/gi, '股二头肌'],
  [/\bsemitendinosus\b/gi, '半腱肌'],
  [/\bsemimembranosus\b/gi, '半膜肌'],
  [/\badductor magnus\b/gi, '大收肌'],
  [/\badductor longus\b/gi, '长收肌'],
  [/\bgracilis\b/gi, '股薄肌'],
  [/\bgastrocnemius\b/gi, '腓肠肌'],
  [/\bsoleus\b/gi, '比目鱼肌'],
  [/\btibialis anterior\b/gi, '胫骨前肌'],
  [/\btibialis posterior\b/gi, '胫骨后肌'],
  [/\bperoneus|fibularis\b/gi, '腓骨肌'],
  [/\bcostal cartilage\b/gi, '肋软骨'],
  [/\bintervertebral disc\b/gi, '椎间盘'],
  [/\bjoint capsule\b/gi, '关节囊'],
  [/\banterior cruciate\b/gi, '前交叉'],
  [/\bposterior cruciate\b/gi, '后交叉'],
  [/\bmedial collateral\b/gi, '内侧副'],
  [/\blateral collateral\b/gi, '外侧副'],
  [/\bsmall intestine\b/gi, '小肠'],
  [/\blarge intestine\b/gi, '大肠'],
  [/\burinary bladder\b/gi, '膀胱'],
];

const TOKEN_DICT: Array<[RegExp, string]> = [
  [/\bleft\b/gi, '左侧'],
  [/\bright\b/gi, '右侧'],
  [/\bsuperior\b/gi, '上'],
  [/\binferior\b/gi, '下'],
  [/\banterior\b/gi, '前'],
  [/\bposterior\b/gi, '后'],
  [/\bmedial\b/gi, '内侧'],
  [/\blateral\b/gi, '外侧'],
  [/\bdeep\b/gi, '深'],
  [/\bsuperficial\b/gi, '浅'],
  [/\bcervical\b/gi, '颈'],
  [/\bthoracic\b/gi, '胸'],
  [/\blumbar\b/gi, '腰'],
  [/\bsacral\b/gi, '骶'],
  [/\bvertebra\b/gi, '椎骨'],
  [/\brib\b/gi, '肋骨'],
  [/\bsternum\b/gi, '胸骨'],
  [/\bmanubrium\b/gi, '胸骨柄'],
  [/\bxiphoid\b/gi, '剑突'],
  [/\bclavicle\b/gi, '锁骨'],
  [/\bscapula\b/gi, '肩胛骨'],
  [/\bhumerus\b/gi, '肱骨'],
  [/\bradius\b/gi, '桡骨'],
  [/\bulna\b/gi, '尺骨'],
  [/\bcarpal\b/gi, '腕骨'],
  [/\bmetacarpal\b/gi, '掌骨'],
  [/\bmetatarsal\b/gi, '跖骨'],
  [/\bphalanx\b/gi, '指/趾骨'],
  [/\bfemur\b/gi, '股骨'],
  [/\bpatella\b/gi, '髌骨'],
  [/\btibia\b/gi, '胫骨'],
  [/\bfibula\b/gi, '腓骨'],
  [/\bcalcaneus\b/gi, '跟骨'],
  [/\btalus\b/gi, '距骨'],
  [/\bsacrum\b/gi, '骶骨'],
  [/\bilium|iliac\b/gi, '髂骨'],
  [/\bischium|ischial\b/gi, '坐骨'],
  [/\bpubis|pubic\b/gi, '耻骨'],
  [/\bpelvis|pelvic|hip bone\b/gi, '骨盆/髋骨'],
  [/\bskull|cranium\b/gi, '颅骨'],
  [/\bmandible\b/gi, '下颌骨'],
  [/\bligament\b/gi, '韧带'],
  [/\btendon\b/gi, '肌腱'],
  [/\bmeniscus\b/gi, '半月板'],
  [/\bcartilage\b/gi, '软骨'],
  [/\bjoint\b/gi, '关节'],
  [/\bbursa\b/gi, '滑囊'],
  [/\bfascia\b/gi, '筋膜'],
  [/\baponeurosis\b/gi, '腱膜'],
  [/\bmuscle\b/gi, '肌肉'],
  [/\bheart\b/gi, '心脏'],
  [/\baorta\b/gi, '主动脉'],
  [/\bartery\b/gi, '动脉'],
  [/\bvein\b/gi, '静脉'],
  [/\blung\b/gi, '肺'],
  [/\blobe\b/gi, '叶'],
  [/\bbronchus\b/gi, '支气管'],
  [/\btrachea\b/gi, '气管'],
  [/\bdiaphragm\b/gi, '膈肌'],
  [/\besophagus|oesophagus\b/gi, '食管'],
  [/\bstomach\b/gi, '胃'],
  [/\bduodenum\b/gi, '十二指肠'],
  [/\bliver\b/gi, '肝脏'],
  [/\bgallbladder\b/gi, '胆囊'],
  [/\bspleen\b/gi, '脾脏'],
  [/\bkidney\b/gi, '肾脏'],
  [/\bureter\b/gi, '输尿管'],
  [/\bpancreas\b/gi, '胰腺'],
  [/\bappendix\b/gi, '阑尾'],
  [/\bcolon\b/gi, '结肠'],
  [/\brectum\b/gi, '直肠'],
  [/\bintestine\b/gi, '肠道'],
  [/\bbladder\b/gi, '膀胱'],
  [/\bthyroid\b/gi, '甲状腺'],
  [/\beye|eyeball\b/gi, '眼球'],
  [/\bintercostal\b/gi, '肋间'],
  [/\babdominal\b/gi, '腹部'],
];

const LAYER_COMMON_FALLBACK: Record<AnatomicalLayer, string> = {
  skin: '体表区域',
  muscle: '肌肉结构',
  tendon: '肌腱 / 筋膜附着点',
  ligament: '韧带 / 关节结构',
  bone: '骨骼结构',
  nerve: '神经干 / 神经分支',
  vascular: '血管 / 循环结构',
  organ: '深层脏器结构',
  acupoint: '经络标准穴位',
};

export function inferLateralityFromName(name: string, x?: number): Laterality {
  const lower = name.toLowerCase();
  if (/\bleft\b|_l\b|\.l\b/.test(lower)) return 'left';
  if (/\bright\b|_r\b|\.r\b/.test(lower)) return 'right';
  if (typeof x === 'number') {
    if (x > 0.03) return 'left';
    if (x < -0.03) return 'right';
  }
  return 'midline';
}

export function inferRegionFromPosition(pos: [number, number, number]): RegionId {
  const [x, y, z] = pos;
  const absX = Math.abs(x);
  if (y >= 1.54) {
    if (z > 0.04 && y >= 1.58 && y <= 1.66 && absX < 0.07) return 'eye';
    return 'head';
  }
  if (y >= 1.42) {
    return absX > 0.12 ? 'shoulder' : 'neck';
  }
  if (y >= 1.18) {
    if (absX > 0.22) return 'upper_limb_hand';
    if (absX > 0.14 && y >= 1.34) return 'shoulder';
    return z < -0.03 ? 'scapula' : 'chest';
  }
  if (y >= 0.88) {
    if (absX > 0.22) return 'upper_limb_hand';
    return z < -0.02 ? 'lower_back' : 'abdomen';
  }
  if (y >= 0.72) {
    if (absX > 0.24) return 'upper_limb_hand';
    return z < -0.04 ? 'lower_back' : 'thigh_calf';
  }
  if (y >= 0.42 && y <= 0.56) return 'knee';
  if (y < 0.2) return 'ankle_foot';
  return 'thigh_calf';
}

export function fallbackTranslateStructure(
  enName: string,
  layer: AnatomicalLayer,
  laterality: Laterality,
): { zhClinical: string; zhCommon: string; painHint: string } {
  let translated = enName;
  let matched = false;
  for (const [pattern, zh] of PHRASE_DICT) {
    if (pattern.test(translated)) {
      translated = translated.replace(pattern, zh);
      matched = true;
    }
  }
  for (const [pattern, zh] of TOKEN_DICT) {
    if (pattern.test(translated)) {
      translated = translated.replace(pattern, zh);
      matched = true;
    }
  }
  const clean = translated
    .replace(/\bof\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/左侧\s*左侧/g, '左侧')
    .replace(/右侧\s*右侧/g, '右侧')
    .trim();

  const sidePrefix =
    laterality === 'left' ? '左侧' : laterality === 'right' ? '右侧' : '';

  const zhClinical = matched ? clean : `${sidePrefix}${enName}`;
  const zhCommon = `${sidePrefix}${LAYER_COMMON_FALLBACK[layer]}`;
  const painHint =
    layer === 'muscle'
      ? '常见于劳损、拉伤或酸胀发紧，按压或活动发力时加重'
      : layer === 'tendon'
        ? '常见于拉扯硬筋痛、肌腱炎，伸展或蹬地发力时锐痛'
        : layer === 'ligament'
          ? '常见于扭伤、牵拉痛或关节受力卡顿'
          : layer === 'bone'
            ? '常见于固定局部压痛、骨面敲击痛或负重刺痛'
            : layer === 'nerve'
              ? '常见电击样串痛、沿线条向下放射发麻或牵扯感'
              : layer === 'vascular'
                ? '常见搏动性痛、局部发胀发烫或循环相关不适'
                : layer === 'organ'
                  ? '深处闷痛、胀痛、绞痛或烧灼感，常与进食/呼吸/体位相关'
                  : layer === 'acupoint'
                    ? '中医经络压痛反应点，可辅助定位牵涉区域'
                    : '体表区域参照';

  return { zhClinical, zhCommon, painHint };
}

export function formatLateralityZh(laterality: Laterality): string {
  switch (laterality) {
    case 'left':
      return '左侧';
    case 'right':
      return '右侧';
    case 'bilateral':
      return '双侧';
    case 'midline':
      return '正中';
  }
}
