import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [],
  theme: {
    ...defaultTheme,
    container: {
      center: true,
    },
    colors: {
      'background':  'hsl(20 14.3% 4.1%)',
      'foreground':  'hsl(0 0% 95%)',
      'popover':  'hsl(0 0% 9%)',
      'popover-foreground':  'hsl(0 0% 95%)',
      'card':  'hsl(24 9.8% 10%)',
      'card-foreground':  'hsl(0 0% 95%)',
      'primary':  'hsl(346.8 77.2% 49.8%)',
      'primary-foreground':  'hsl(355.7 100% 97.3%)',
      'secondary':  'hsl(240 3.7% 15.9%)',
      'secondary-foreground':  'hsl(0 0% 98%)',
      'muted':  'hsl(0 0% 15%)',
      'muted-foreground':  'hsl(240 5% 64.9%)',
      'accent':  'hsl(12 6.5% 15.1%)',
      'accent-foreground':  'hsl(0 0% 98%)',
      'destructive':  'hsl(0 62.8% 30.6%)',
      'destructive-foreground':  'hsl(0 85.7% 97.3%)',
      'border':  'hsl(240 3.7% 15.9%)',
      'input':  'hsl(240 3.7% 15.9%)',
      'ring':  'hsl(346.8 77.2% 49.8%)',
      'chart-1':  'hsl(220 70% 50%)',
      'chart-2':  'hsl(160 60% 45%)',
      'chart-3':  'hsl(30 80% 55%)',
      'chart-4':  'hsl(280 65% 60%)',
      'chart-5':  'hsl(340 75% 55%)'
    },
    extend: {},
  },
  plugins: [],
} satisfies Config

