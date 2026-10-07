import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Toggl Track's palette: plum chrome, violet accents, coral for "over".
const violet: MantineColorsTuple = [
  '#f8f0fc',
  '#efdcf7',
  '#dcb6ec',
  '#c98ee2',
  '#b86cd8',
  '#ad56d2',
  '#a74acf',
  '#9a3fc0',
  '#8536a9',
  '#6f2a8f',
]

const coral: MantineColorsTuple = [
  '#ffeced',
  '#fcd7d9',
  '#f4aeb1',
  '#ed8287',
  '#e75d63',
  '#e4474e',
  '#e33a42',
  '#ca2d35',
  '#b4252e',
  '#9e1925',
]

export const theme = createTheme({
  primaryColor: 'violet',
  colors: { violet, coral },
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  headings: { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontWeight: '700' },
  defaultRadius: 'md',
})
