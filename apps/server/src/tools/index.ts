import { getTimeTool } from './time'
import { calculatorTool } from './calculator'

export const toolList = [getTimeTool, calculatorTool];

export const toolMap = {
  get_current_time: getTimeTool,
  calculator: calculatorTool,
};