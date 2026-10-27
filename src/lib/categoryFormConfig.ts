export interface CategoryFormConfig {
  hideDescription?: boolean;
  hidePrice?: boolean;
  hideCondition?: boolean;
  imagesOptional?: boolean;
  contactOptional?: boolean;
  hideSellerInfo?: boolean;
}

interface CategoryLike {
  id?: string;
  name?: string | null;
  slug?: string | null;
  formConfig?: CategoryFormConfig | null;
  effectiveFormConfig?: CategoryFormConfig | null;
  parent?: CategoryLike | null;
}

const NO_COMMERCE_CONFIG: CategoryFormConfig = {
  hideDescription: true,
  hidePrice: true,
  hideCondition: true,
};

const LOVE_AND_DATING_CONFIG: CategoryFormConfig = {
  hideDescription: true,
  hidePrice: true,
  hideCondition: true,
  imagesOptional: true,
  contactOptional: true,
  hideSellerInfo: true,
};

const FUNERALS_CONFIG: CategoryFormConfig = {
  hideDescription: true,
  hidePrice: true,
  hideCondition: true,
  imagesOptional: true,
};

export function presetFormConfigForCategory(
  cat?: CategoryLike | null
): CategoryFormConfig {
  if (!cat) return {};
  const text = `${cat.name || ''} ${cat.slug || ''}`.toLowerCase();

  if (
    text.includes('love & dating') ||
    text.includes('love and dating') ||
    text.includes('love-dating') ||
    text.includes('love-and-dating')
  ) {
    return { ...LOVE_AND_DATING_CONFIG };
  }

  if (
    text.includes('funeral') ||
    text.includes('memorial') ||
    text.includes('obituar')
  ) {
    return { ...FUNERALS_CONFIG };
  }

  if (
    text.includes('lost & found') ||
    text.includes('lost and found') ||
    text.includes('lost-found') ||
    text.includes('lost-and-found') ||
    text.includes('people & connections') ||
    text.includes('people and connections') ||
    text.includes('people-connections') ||
    text.includes('people-and-connections') ||
    text.includes('events & notices') ||
    text.includes('events and notices') ||
    text.includes('events-notices') ||
    text.includes('events-and-notices')
  ) {
    return { ...NO_COMMERCE_CONFIG };
  }

  return {};
}

function cleanConfig(
  cfg?: CategoryFormConfig | null
): Partial<CategoryFormConfig> {
  if (!cfg || typeof cfg !== 'object') return {};
  const out: Partial<CategoryFormConfig> = {};
  const keys: (keyof CategoryFormConfig)[] = [
    'hideDescription',
    'hidePrice',
    'hideCondition',
    'imagesOptional',
    'contactOptional',
    'hideSellerInfo',
  ];
  for (const k of keys) {
    if (typeof cfg[k] === 'boolean') {
      out[k] = cfg[k];
    }
  }
  return out;
}

export function resolveEffectiveFormConfig(
  category?: CategoryLike | null,
  parentCategory?: CategoryLike | null
): CategoryFormConfig {
  const effectiveParent = parentCategory || category?.parent || null;
  return {
    ...presetFormConfigForCategory(effectiveParent),
    ...cleanConfig(effectiveParent?.effectiveFormConfig),
    ...cleanConfig(effectiveParent?.formConfig),
    ...presetFormConfigForCategory(category),
    ...cleanConfig(category?.effectiveFormConfig),
    ...cleanConfig(category?.formConfig),
  };
}
