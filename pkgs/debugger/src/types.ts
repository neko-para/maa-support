export interface PipelineEntry {
  recognition:
    | 'DirectHit'
    | 'TemplateMatch'
    | 'FeatureMatch'
    | 'ColorMatch'
    | 'OCR'
    | 'NeuralNetworkClassify'
    | 'NeuralNetworkDetect'
    | 'Custom'
  action?:
    | 'DoNothing'
    | 'Click'
    | 'Swipe'
    | 'Key'
    | 'Text'
    | 'StartApp'
    | 'StopApp'
    | 'StopTask'
    | 'Custom'
  next?: string | string[]
}

export type PipelineFile = Record<string, PipelineEntry>
