
export const useTeam = () => {
    const teamColors = {
        red: {
            lightMode: '#ff1a1a',
            darkMode: '#ff4d4d',
        },
        blue: {
            lightMode: '#1a75ff',
            darkMode: '#4d94ff',
        },
        green: {
            lightMode: '#33cc33',
            darkMode: '#66ff66',
        },
        yellow: {
            lightMode: '#ffdb4d',
            darkMode: '#ffe066',
        },
        purple: {
            lightMode: '#b84dff',
            darkMode: '#d580ff',
        },
        teal: {
            lightMode: '#33cccc',
            darkMode: '#66ffff',
        }
    }


    const getTeamColor = (team: keyof typeof teamColors, mode: 'light' | 'dark') => {
        return teamColors[team][`${mode}Mode`]
    }

    const getTeamColors = () => {
        return teamColors
    }

    return {
        getTeamColor,
        getTeamColors,
    }
}