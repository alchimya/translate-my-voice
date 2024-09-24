import { AsyncAudioInputStream } from "./AsyncAudioInputStream";

export interface AwsClientConfig {
    region: string;
    identityPoolId: string;
}

export interface AwsTranslateClientConfig {
    region: string;
    identityPoolId: string;
    inputLanguageId?: string;
    outputLanguageId: string;
}

export interface AwsPollyClientConfig {
    region: string;
    identityPoolId: string;
    voiceId: string;
}

export interface AwsTranscribeClientConfig {
    region: string;
    identityPoolId: string;
    inputLanguageId: any;
}

