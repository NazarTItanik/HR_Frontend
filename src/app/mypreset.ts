import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const MyPreset = definePreset(Aura, {
    semantic: {
        colorScheme: {
            light: {
                semantic: {
                    highlight: {
                        background: '{primary.50}',
                        color: '{primary.700}',
                    }
                }
            },
            dark: {
                semantic: {
                    highlight: {
                        background: '{primary.200}',
                        color: '{primary.900}',
                    }
                }
            }
        }
    }
});

export default MyPreset;