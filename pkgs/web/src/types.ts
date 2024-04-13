export type Rect = [number, number, number, number]

export type Recognition =
  | {
      recognition?: 'DirectHit'
    }
  | {
      recognition: 'TemplateMatch'
      roi?: Rect | Rect[]
      template: string | string[]
      threshold?: number | number[]
      order_by?: 'Horizontal' | 'Vertical' | 'Score' | 'Random'
      index?: number
      method?: 1 | 3 | 5
      green_mask?: boolean
    }
  | {
      recognition: 'FeatureMatch'
      roi?: Rect | Rect[]
      template: string | string[]
      count?: number
      order_by?: 'Horizontal' | 'Vertical' | 'Score' | 'Area' | 'Random'
      index?: number
      green_mask?: boolean
      detector?: 'SIFT' | 'KAZE' | 'AKAZE' | 'BRISK' | 'ORB'
      ratio?: number
    }
  | {
      recognition: 'ColorMatch'
      roi?: Rect | Rect[]
      method?: 4 | 40 | 6
      lower?: number[] | number[][]
      upper?: number[] | number[][]
      count?: number
      order_by?: 'Horizontal' | 'Vertical' | 'Score' | 'Area' | 'Random'
      index?: number
      connected?: boolean
    }
  | {
      recognition: 'OCR'
      roi?: Rect | Rect[]
      text: string
      replace?: [string, string] | [string, string][]
      order_by?: 'Horizontal' | 'Vertical' | 'Area' | 'Length' | 'Random'
      index?: number
      only_rec?: boolean
      model?: string
    }
  | {
      recognition: 'NeuralNetworkClassify'
      cls_size: number
      labels: string[]
      model: string
      expected: number | number[]
      order_by?: 'Horizontal' | 'Vertical' | 'Score' | 'Random'
      index?: number
    }
  | {
      recognition: 'NeuralNetworkDetect'
      cls_size: number
      labels: string[]
      model: string
      expected: number | number[]
      threshold?: number | number[]
      order_by?: 'Horizontal' | 'Vertical' | 'Score' | 'Area' | 'Random'
      index?: number
    }
  | {
      recognition: 'Custom'
      custom_recognition: string
      custom_recognition_param?: unknown
    }

export type Target = true | string | Rect

export type Action =
  | {
      action?: 'DoNothing'
    }
  | {
      action: 'Click'
      target?: Target
      target_offset?: Rect
    }
  | {
      action: 'Swipe'
      begin?: Target
      begin_offset?: Rect
      end?: Target
      end_offset?: Rect
    }
  | {
      action: 'Key'
      key: number | number[]
    }
  | {
      action: 'Text'
      // text
    }
  | {
      action: 'StartApp'
      package?: string
    }
  | {
      action: 'StopApp'
      package?: string
    }
  | {
      action: 'StopTask'
    }
  | {
      action: 'Custom'
      custom_action: string
      custom_action_param?: unknown
    }

export type Freeze = {
  time?: number
  target?: Target
  target_offset?: Rect
  threshold?: number
  method?: 1 | 3 | 5
}

export type Task = Recognition &
  Action & {
    next?: string | string[]
    is_sub?: boolean
    inverse?: boolean
    enabled?: boolean
    timeout?: number
    timeout_next?: string | string[]
    times_limit?: number
    runout_next?: string | string[]
    pre_delay?: number
    post_delay?: number
    pre_wait_freezes?: number | Freeze
    post_wait_freezes?: number | Freeze
    focus?: boolean
  }

export type RestrictWith<
  T extends Record<string, unknown>,
  K extends keyof T,
  R extends T[K],
  V extends T = T
> = V extends unknown ? (V[K] extends R ? V : never) : never
