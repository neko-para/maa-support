export type Rect = [number, number, number, number]

export type Recognition =
  | {
      type?: 'DirectHit'
    }
  | {
      type: 'TemplateMatch'
      roi?: Rect | Rect[]
      template: string | string[]
      threshold?: number | number[]
      order_by?: 'Horizontal' | 'Vertical' | 'Score' | 'Random'
      index?: number
      method?: 1 | 3 | 5
      green_mask?: boolean
    }

export type Action =
  | {
      type?: 'DoNothing'
    }
  | {
      type: 'Click'
      target?: true | string | Rect
      target_offset?: Rect
    }

export type Task = Recognition &
  Action & {
    next?: string | string[]
    is_sub?: boolean
    inverse?: boolean
    enabled?: boolean
    timeout?: number
    times_limit?: number
    pre_delay?: number
    post_delay?: number
    focus?: boolean
  }
