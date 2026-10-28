/**
 * Wording of validation messages, per language. Only text lives here: the
 * bounds and rules themselves stay in constants.ts and solarEngine.ts.
 */
import type { NUMERIC_RULES } from './constants';

export type Locale = 'fr' | 'ar';

export type RuleKey = keyof typeof NUMERIC_RULES;

export interface RuleText {
  label: string;
  /** Unit appended to values in messages ('' for ratios and counts). */
  unit: string;
  /** Advice shown when a value is outside the usual band. */
  hint?: string;
}

export interface MessageCatalog {
  rules: Record<RuleKey, RuleText>;
  namedRow: (name: string) => string;
  unnamedRow: (rowNumber: number) => string;
  rowField: (row: string, fieldLabel: string) => string;
  invalidNumber: (label: string) => string;
  notInteger: (label: string) => string;
  greaterThan: (label: string, min: string) => string;
  notNegative: (label: string) => string;
  atLeast: (label: string, min: string) => string;
  notExceed: (label: string, max: string) => string;
  outsideTypical: (label: string, value: string, min: string, max: string, hint: string) => string;
  noAppliances: string;
  missingId: (row: string) => string;
  duplicateId: (row: string) => string;
  missingName: (row: string) => string;
  zeroUsage: (row: string) => string;
  simultaneousInvalid: (row: string) => string;
  voltageInvalid: (choices: string) => string;
  chemistryInvalid: string;
  customDodRequired: (min: string, max: string) => string;
  noEnergy: string;
  noSimultaneous: string;
  excludedLoad: (row: string, totalPower: string, peak: string) => string;
  peakExceedsInverter: (peak: string, inverter: string) => string;
  voltageBelow: (override: number, recommended: number, peak: string, amps: string) => string;
  /** Last pass over every message (French typography needs no-break spaces). */
  finalize: (text: string) => string;
}

/** French typography: no-break space before ":", ";", "!", "?" and inside « », so lines never start with punctuation. */
function frenchSpacing(text: string): string {
  return text.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ');
}

const fr: MessageCatalog = {
  rules: {
    quantity: { label: 'Quantité', unit: '' },
    powerW: { label: 'Puissance', unit: 'W' },
    hoursPerDay: { label: 'Heures par jour', unit: 'h' },
    peakSunHours: {
      label: 'Heures de soleil crête (PSH)',
      unit: 'h',
      hint: "Vérifiez les données d'irradiation du site et du mois de dimensionnement.",
    },
    deratingFactor: {
      label: 'Coefficient de pertes (DF)',
      unit: '',
      hint: "En dessous de 0,7, les pertes sont inhabituellement élevées ; au-dessus de 0,9, l'hypothèse est optimiste pour le terrain.",
    },
    panelPowerW: { label: 'Puissance du panneau', unit: 'W', hint: 'Vérifiez la puissance crête (STC) sur la fiche technique du module.' },
    inverterSafetyFactor: {
      label: 'Coefficient de sécurité onduleur',
      unit: '',
      hint: "La marge standard est de 1,3 ; en dessous de 1,25 la réserve pour les pointes est faible, au-dessus de 2 l'onduleur est surdimensionné.",
    },
    batteryEfficiency: { label: 'Rendement batterie', unit: '', hint: 'Comptez environ 0,8 pour le plomb et 0,95 pour le lithium.' },
    daysOfAutonomy: {
      label: "Jours d'autonomie",
      unit: 'jours',
      hint: 'En dessous de 1 jour, le parc ne couvre pas une journée de consommation ; au-delà de 5 jours, sa taille et son coût augmentent vite.',
    },
    customDepthOfDischarge: { label: 'Profondeur de décharge personnalisée', unit: '' },
  },
  namedRow: (name) => `« ${name} »`,
  unnamedRow: (rowNumber) => `Charge n° ${rowNumber}`,
  rowField: (row, fieldLabel) => `${row}, ${fieldLabel.toLowerCase()}`,
  // "Label : …" keeps the sentence grammatical whatever the gender of the label.
  invalidNumber: (label) => `${label} : saisissez un nombre.`,
  notInteger: (label) => `${label} : saisissez un nombre entier.`,
  greaterThan: (label, min) => `${label} : la valeur doit être supérieure à ${min}.`,
  notNegative: (label) => `${label} : la valeur ne peut pas être négative.`,
  atLeast: (label, min) => `${label} : la valeur doit être d'au moins ${min}.`,
  notExceed: (label, max) => `${label} : la valeur ne doit pas dépasser ${max}.`,
  outsideTypical: (label, value, min, max, hint) => `${label} : ${value}, hors de la plage usuelle ${min}–${max}. ${hint}`,
  noAppliances: 'Ajoutez au moins une charge au tableau.',
  missingId: (row) => `${row} : identifiant manquant.`,
  duplicateId: (row) => `${row} : identifiant déjà utilisé par une autre charge.`,
  missingName: (row) => `${row} : nom manquant.`,
  zeroUsage: (row) => `${row} : 0 h par jour, aucune énergie ajoutée.`,
  simultaneousInvalid: (row) => `${row} : indiquez si la charge est simultanée ou non.`,
  voltageInvalid: (choices) => `Tension du système : choisissez Auto ou ${choices} V.`,
  chemistryInvalid: 'Choisissez une technologie de batterie.',
  customDodRequired: (min, max) => `Saisissez une profondeur de décharge entre ${min} et ${max} pour la batterie personnalisée.`,
  noEnergy: "Énergie journalière totale nulle (0 Wh) : saisissez les heures d'utilisation d'au moins une charge.",
  noSimultaneous: 'Puissance de pointe nulle (0 W) : cochez « Simultané » pour au moins une charge.',
  excludedLoad: (row, totalPower, peak) =>
    `${row} (${totalPower}) ne fait pas partie des charges simultanées, mais sa puissance dépasse à elle seule ` +
    `la pointe calculée (${peak}). La pointe, qui fixe la tension du système, est sous-estimée : cochez « Simultané » ` +
    'ou revoyez le planning des charges.',
  peakExceedsInverter: (peak, inverter) =>
    `La puissance de pointe (${peak}) dépasse la puissance onduleur calculée (${inverter}) : l'onduleur ne pourrait ` +
    "pas alimenter toutes les charges simultanées. Choisissez un onduleur d'au moins la puissance de pointe.",
  voltageBelow: (override, recommended, peak, amps) =>
    `Tension forcée à ${override} V, en dessous des ${recommended} V recommandés pour une pointe de ${peak}. ` +
    `Prévoyez environ ${amps} sur le bus continu en pointe : vérifiez la section des câbles et les protections.`,
  finalize: frenchSpacing,
};

const ar: MessageCatalog = {
  rules: {
    quantity: { label: 'الكمية', unit: '' },
    powerW: { label: 'القدرة', unit: 'W' },
    hoursPerDay: { label: 'ساعات التشغيل', unit: 'h' },
    peakSunHours: { label: 'ساعات الذروة الشمسية (PSH)', unit: 'h', hint: 'تحقق من بيانات الإشعاع للموقع وشهر التصميم.' },
    deratingFactor: {
      label: 'معامل الفقد (DF)',
      unit: '',
      hint: 'أقل من 0,7 يعني فقداً مرتفعاً بشكل غير معتاد، وأكثر من 0,9 افتراض متفائل ميدانياً.',
    },
    panelPowerW: { label: 'قدرة اللوح', unit: 'W', hint: 'تحقق من القدرة القصوى (STC) في البطاقة الفنية للوح.' },
    inverterSafetyFactor: {
      label: 'معامل أمان العاكس',
      unit: '',
      hint: 'الهامش المعتاد هو 1,3؛ أقل من 1,25 يترك هامشاً ضعيفاً للذروات، وأكثر من 2 يضخّم العاكس.',
    },
    batteryEfficiency: { label: 'كفاءة البطارية', unit: '', hint: 'حوالي 0,8 للرصاص و 0,95 لليثيوم.' },
    daysOfAutonomy: {
      label: 'أيام الاستقلالية',
      unit: 'أيام',
      hint: 'أقل من يوم لا يغطي استهلاك يوم كامل، وأكثر من 5 أيام يضخّم حجم البنك وتكلفته.',
    },
    customDepthOfDischarge: { label: 'عمق التفريغ المخصص', unit: '' },
  },
  namedRow: (name) => `«${name}»`,
  unnamedRow: (rowNumber) => `الحمل رقم ${rowNumber}`,
  rowField: (row, fieldLabel) => `${row} – ${fieldLabel}`,
  invalidNumber: (label) => `${label}: أدخل رقماً.`,
  notInteger: (label) => `${label}: أدخل عدداً صحيحاً.`,
  greaterThan: (label, min) => `${label}: يجب أن تكون القيمة أكبر من ${min}.`,
  notNegative: (label) => `${label}: لا يمكن أن تكون القيمة سالبة.`,
  atLeast: (label, min) => `${label}: يجب ألا تقل القيمة عن ${min}.`,
  notExceed: (label, max) => `${label}: يجب ألا تتجاوز القيمة ${max}.`,
  outsideTypical: (label, value, min, max, hint) => `${label}: ${value} خارج المجال المعتاد ${min}–${max}. ${hint}`,
  noAppliances: 'أضف حملاً واحداً على الأقل إلى الجدول.',
  missingId: (row) => `${row}: المعرّف مفقود.`,
  duplicateId: (row) => `${row}: المعرّف مستخدم لحمل آخر.`,
  missingName: (row) => `${row}: اسم الجهاز غير محدد.`,
  zeroUsage: (row) => `${row}: صفر ساعة يومياً، لا يضيف أي طاقة.`,
  simultaneousInvalid: (row) => `${row}: حدّد ما إذا كان الحمل متزامناً أم لا.`,
  voltageInvalid: (choices) => `جهد النظام: اختر «تلقائي» أو ${choices} V.`,
  chemistryInvalid: 'اختر تقنية البطارية.',
  customDodRequired: (min, max) => `أدخل عمق تفريغ بين ${min} و ${max} للبطارية المخصصة.`,
  noEnergy: 'الطاقة اليومية الإجمالية صفر (0 Wh): أدخل ساعات التشغيل لحمل واحد على الأقل.',
  noSimultaneous: 'قدرة الذروة صفر (0 W): فعّل «متزامن» لحمل واحد على الأقل.',
  excludedLoad: (row, totalPower, peak) =>
    `${row} (${totalPower}) غير محسوب ضمن الأحمال المتزامنة لكن قدرته وحدها تتجاوز الذروة المحسوبة (${peak}). ` +
    'الذروة التي تحدد جهد النظام أقل من الواقع: فعّل «متزامن» أو راجع جدول التشغيل.',
  peakExceedsInverter: (peak, inverter) =>
    `قدرة الذروة (${peak}) تتجاوز قدرة العاكس المحسوبة (${inverter}): لن يستطيع العاكس تشغيل كل الأحمال المتزامنة. ` +
    'اختر عاكساً لا تقل قدرته عن قدرة الذروة.',
  voltageBelow: (override, recommended, peak, amps) =>
    `الجهد مفروض على ${override} V، أقل من ${recommended} V الموصى بها لذروة ${peak}. ` +
    `توقّع حوالي ${amps} على ناقل التيار المستمر في الذروة: تحقق من مقاطع الكابلات والحمايات.`,
  finalize: (text) => text,
};

export const CATALOGS: Readonly<Record<Locale, MessageCatalog>> = { fr, ar };
