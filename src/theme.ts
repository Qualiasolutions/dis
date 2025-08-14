import { MantineThemeOverride, createTheme } from '@mantine/core'

export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'Noto Sans Arabic, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace',
  headings: {
    fontFamily: 'Noto Sans Arabic, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    fontWeight: '600',
  },
  colors: {
    // Custom color palette for dealership branding
    brand: [
      '#e3f2fd',
      '#bbdefb',
      '#90caf9',
      '#64b5f6',
      '#42a5f5',
      '#2196f3',
      '#1976d2',
      '#1565c0',
      '#0d47a1',
      '#0a3a8a',
    ],
  },
  components: {
    Button: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
    NumberInput: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
      },
    },
  },
  breakpoints: {
    xs: '36em', // 576px
    sm: '48em', // 768px
    md: '62em', // 992px
    lg: '75em', // 1200px
    xl: '88em', // 1408px
  },
})