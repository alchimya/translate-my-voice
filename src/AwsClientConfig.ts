export interface AwsClientConfig {
    region: string;
    identityPoolId: string;
}

export interface AwsTranslateClientConfig extends AwsClientConfig {
    inputLanguageId?: string;
    outputLanguageId: string;
}

export interface AwsPollyClientConfig extends AwsClientConfig {
    voiceId: string;
}

export interface AwsTranscribeClientConfig extends AwsClientConfig {
    inputLanguageId: any;
}

