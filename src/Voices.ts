import { VoiceId } from "@aws-sdk/client-polly";
import { Languages } from "./LanguageSelect";

export enum VoicesInfoTypes {
    female = 0,
    male = 1
}
export type VoicesInfo = {
    female: VoiceId;
    male: VoiceId;
    unsupported?: number[]
};

export const VoicesMap: { [language: string]: VoicesInfo } = {
    [Languages.Italian]: {
        female: "Bianca",
        male: "Adriano"
    },
    [Languages.English]: {
        female: "Joanna",
        male: "Matthew"
    },
    [Languages.Finnish]: {
        female: "Suvi",
        male: "Matthew",
        unsupported: [VoicesInfoTypes.male] // MALTE NOT SUPPORTED
    },
    [Languages.French]: {
        female: "Lea",
        male: "Remi"
    },
    [Languages.German]: {
        female: "Vicki",
        male: "Daniel"
    },
    [Languages.Japanese]: {
        female: "Tomoko",
        male: "Takumi"
    },
    [Languages.Spanish]: {
        female: "Lucia",
        male: "Sergio"
    },
    [Languages.Czech]: {
        female: "Jitka",
        male: "Matthew",
        unsupported: [VoicesInfoTypes.male] // MALTE NOT SUPPORTED
    }
};