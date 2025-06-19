import { createTheme } from '@mui/material/styles';

// Create a pure black theme with high-contrast accents as specified in project requirements
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff', // Bright cyan for high contrast
      light: '#80ffff',
      dark: '#00b0ff',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff1744', // Bright red accent for high contrast
      light: '#ff616f',
      dark: '#c4001d',
      contrastText: '#000000',
    },
    background: {
      default: '#000000', // Pure black background
      paper: '#0a0a0a', // Almost black for cards/panels
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#29b6f6',
    },
    success: {
      main: '#66bb6a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          boxShadow: '0 2px 4px rgba(144, 202, 249, 0.3)',
        },
        containedSecondary: {
          boxShadow: '0 2px 4px rgba(244, 143, 177, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme;
