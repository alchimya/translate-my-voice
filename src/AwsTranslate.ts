import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { AwsTranslateClientConfig } from "./AwsClientConfig";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
export class AwsTranslate {
    private config: AwsTranslateClientConfig;
    client: TranslateClient;

    constructor (config: AwsTranslateClientConfig) {
        this.config = config;
        this.client = new TranslateClient({
            region: config.region,
            credentials: fromCognitoIdentityPool({
              clientConfig: { region: config.region },
              identityPoolId: config.identityPoolId,
            }),
        });

    }

    translate = async (text: string): Promise<string> => {
        const command = new TranslateTextCommand({
            Text: text,
            SourceLanguageCode: this.config.inputLanguageId || 'auto', 
            TargetLanguageCode: this.config.outputLanguageId,
          });
      
          const response = await this.client.send(command);
          return response?.TranslatedText || text; // Return translated text or original if fails
    };
}