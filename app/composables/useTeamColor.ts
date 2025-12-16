export const useTeamColor = () => {
    const teamColors = [
        {
            key: 'red',
            name: 'Red',
            color: {
                light: '#ff1a1a',
                dark: '#ff4d4d',
            }
        },
        {
            key: 'blue',
            name: 'Blue',
            color: {
                light: '#1a75ff',
                dark: '#4d94ff',
            }
        },
        {
            key: 'green',
            name: 'Green',
            color: {
                light: '#33cc33',
                dark: '#66ff66',
            }
        },
        {
            key: 'yellow',
            name: 'Yellow',
            color: {
                light: '#ffdb4d',
                dark: '#ffe066',
            }
        },
        {
            key: 'purple',
            name: 'Purple',
            color: {
                light: '#b84dff',
                dark: '#d580ff',
            }
        },
        {
            key: 'teal',
            name: 'Teal',
            color: {
                light: '#33cccc',
                dark: '#66ffff',
            }
        }
    ]


    const getTeamColor = (team: string, mode?: 'light' | 'dark') => {

        type Mode = 'light' | 'dark'

        const colorModeComposable = typeof useColorMode === 'function' ? useColorMode() : undefined

        const finalMode = (mode ?? (
            (colorModeComposable && (colorModeComposable.value === 'light' || colorModeComposable.value === 'dark'))
                ? colorModeComposable.value
                : 'dark'
        )) as Mode

        const entry = teamColors.find(c => c.key === team)
        if (!entry) return ''

        return finalMode === 'light' ? entry.color.light : entry.color.dark
    }

    const getTeamColors = () => {
        return teamColors
    }

    return {
        getTeamColor,
        getTeamColors,
    }
}