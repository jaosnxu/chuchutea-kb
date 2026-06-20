import type { ModuleInfo } from './types'

export const MAX_TITLE = 40

export const MODULES: readonly ModuleInfo[] = [
  { key: 'product', label: '产品库' },
  { key: 'sop', label: '操作SOP' },
  { key: 'training', label: '培训资料' },
  { key: 'store', label: '门店信息' },
  { key: 'marketing', label: '营销活动' },
  { key: 'brand', label: '品牌' },
  { key: 'franchise', label: '特许经营' },
  { key: 'operations', label: '运营管理' },
  { key: 'equipment', label: '设备' },
  { key: 'maintenance', label: '维修' },
] as const

export const CITIES = [
  { zh: '大诺夫哥罗德', ru: 'Великий Новгород' },
  { zh: '普斯科夫', ru: 'Псков' },
  { zh: '特维尔', ru: 'Тверь' },
] as const
