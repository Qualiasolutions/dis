import { MantineThemeOverride, createTheme } from '@mantine/core'

export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'dealership',
  defaultRadius: 'sm',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    fontWeight: '700',
  },
  colors: {
    // Professional dealership color scheme - black, white, minimal blue
    dealership: [
      '#ffffff',  // Pure white
      '#fafafa',  // Light gray
      '#f5f5f5',  // Lighter gray  
      '#e5e5e5',  // Light medium gray
      '#d4d4d4',  // Medium gray
      '#a3a3a3',  // Darker medium gray
      '#737373',  // Dark gray
      '#525252',  // Darker gray
      '#404040',  // Very dark gray
      '#171717',  // Almost black
    ],
    // Minimal blue accent for important actions
    accent: [
      '#eff6ff',
      '#dbeafe', 
      '#bfdbfe',
      '#93c5fd',
      '#60a5fa',
      '#3b82f6',  // Main accent blue
      '#2563eb',
      '#1d4ed8',
      '#1e40af',
      '#1e3a8a',
    ],
  },
  components: {
    Button: {
      defaultProps: {
        size: 'md',
        radius: 'sm',
      },
      styles: {
        root: {
          fontWeight: 600,
          border: '1px solid transparent',
          transition: 'all 0.2s ease',
          '&[data-variant="filled"][data-color="dealership"]': {
            backgroundColor: '#171717',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#404040',
            },
          },
          '&[data-variant="filled"][data-color="accent"]': {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#2563eb',
            },
          },
          '&[data-variant="outline"]': {
            borderColor: '#e5e5e5',
            color: '#171717',
            '&:hover': {
              backgroundColor: '#fafafa',
              borderColor: '#d4d4d4',
            },
          },
        },
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
        radius: 'sm',
      },
      styles: {
        input: {
          border: '1px solid #e5e5e5',
          '&:focus': {
            borderColor: '#3b82f6',
          },
        },
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
        radius: 'sm',
      },
      styles: {
        input: {
          border: '1px solid #e5e5e5',
          '&:focus': {
            borderColor: '#3b82f6',
          },
        },
      },
    },
    NumberInput: {
      defaultProps: {
        size: 'md',
        radius: 'sm',
      },
      styles: {
        input: {
          border: '1px solid #e5e5e5',
          '&:focus': {
            borderColor: '#3b82f6',
          },
        },
      },
    },
    Textarea: {
      defaultProps: {
        size: 'md',
        radius: 'sm',
      },
      styles: {
        input: {
          border: '1px solid #e5e5e5',
          '&:focus': {
            borderColor: '#3b82f6',
          },
        },
      },
    },
    Card: {
      defaultProps: {
        shadow: 'xs',
        radius: 'sm',
        withBorder: true,
      },
      styles: {
        root: {
          borderColor: '#e5e5e5',
          backgroundColor: '#ffffff',
        },
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'xs',
        radius: 'sm',
      },
      styles: {
        root: {
          backgroundColor: '#ffffff',
        },
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