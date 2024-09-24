import { 
    TranslateClient, 
    TranslateTextCommand 
} from "@aws-sdk/client-translate";
import { AwsClientConfig } from "./AwsClientConfig";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

export class AwsTranslate {
    private config: AwsClientConfig;
    client: TranslateClient;

    constructor (config: AwsClientConfig) {
        this.config = config;
        this.client = new TranslateClient({
            region: config.region,
            credentials: fromCognitoIdentityPool({
              clientConfig: { region: config.region },
              identityPoolId: config.identityPoolId,
            }),
        });

    }

    translate = async (text: string, inputLanguageId: string, outputLanguageId: string): Promise<string> => {
        const command = new TranslateTextCommand({
            Text: text,
            SourceLanguageCode: inputLanguageId || 'auto', 
            TargetLanguageCode: outputLanguageId,
          });
      
          const response = await this.client.send(command);
          return response?.TranslatedText || text; // Return translated text or original if fails
    };
}