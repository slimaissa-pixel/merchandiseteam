import {
    BebasNeue_400Regular,
    useFonts as useBebasFonts,
} from '@expo-google-fonts/bebas-neue';
import {
    Lato_300Light,
    Lato_400Regular,
    Lato_700Bold,
    useFonts as useLatoFonts,
} from '@expo-google-fonts/lato';
import {
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts as useMontserratFonts,
} from '@expo-google-fonts/montserrat';
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
    useFonts as usePlayfairFonts,
} from '@expo-google-fonts/playfair-display';
import {
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    useFonts as useRobotoFonts,
} from '@expo-google-fonts/roboto';

export function useAppFonts() {
    const [robotoLoaded] = useRobotoFonts({
        Roboto_300Light,
        Roboto_400Regular,
        Roboto_500Medium,
        Roboto_700Bold,
    });

    const [montserratLoaded] = useMontserratFonts({
        Montserrat_400Regular,
        Montserrat_500Medium,
        Montserrat_600SemiBold,
        Montserrat_700Bold,
    });

    const [playfairLoaded] = usePlayfairFonts({
        PlayfairDisplay_400Regular,
        PlayfairDisplay_500Medium,
        PlayfairDisplay_600SemiBold,
        PlayfairDisplay_700Bold,
        PlayfairDisplay_800ExtraBold,
        PlayfairDisplay_900Black,
    });

    const [latoLoaded] = useLatoFonts({
        Lato_300Light,
        Lato_400Regular,
        Lato_700Bold,
    });

    const [bebasLoaded] = useBebasFonts({
        BebasNeue_400Regular,
    });

    return {
        fontsLoaded: robotoLoaded && montserratLoaded && playfairLoaded && latoLoaded && bebasLoaded
    };
}

export const Fonts = {
    heading: 'Montserrat_700Bold',
    headingBold: 'Montserrat_700Bold',
    headingSemiBold: 'Montserrat_600SemiBold',
    headingMedium: 'Montserrat_500Medium',
    headingRegular: 'Montserrat_400Regular',
    headingLight: 'Montserrat_400Regular',
    headingXBold: 'Montserrat_700Bold',
    headingBlack: 'Montserrat_700Bold',

    subheading: 'PlayfairDisplay_600SemiBold',
    subheadingMedium: 'PlayfairDisplay_500Medium',
    subheadingRegular: 'PlayfairDisplay_400Regular',

    body: 'Roboto_400Regular',
    bodyLight: 'Roboto_300Light',
    bodyMedium: 'Roboto_500Medium',
    bodyBold: 'Roboto_700Bold',
    bodySemiBold: 'Roboto_700Bold',

    secondary: 'Lato_400Regular',
    secondaryLight: 'Lato_300Light',
    secondaryBold: 'Lato_700Bold',
    cta: 'Montserrat_700Bold',
    mono: 'Roboto_400Regular', // Using Roboto as a fallback for mono if not specifically loaded
} as const;
