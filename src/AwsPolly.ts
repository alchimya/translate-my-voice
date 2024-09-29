import { 
  PollyClient, 
  SynthesizeSpeechCommand, 
  VoiceId 
} from "@aws-sdk/client-polly";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { AwsClientConfig } from "./AwsClientConfig";

export class AwsPolly {
    private client: PollyClient;
    config: AwsClientConfig;

    constructor (config: AwsClientConfig) {
        this.config = config;
        this.client = new PollyClient({
            region: config.region,
            credentials: fromCognitoIdentityPool({
              clientConfig: { region: config.region },
              identityPoolId: config.identityPoolId,
            }),
        });
    }
    speech = async (text: string, voiceId: VoiceId) => {
      const command = new SynthesizeSpeechCommand({
        OutputFormat: "mp3",
        Text: text,
        Engine: "neural",
        VoiceId: voiceId
      });

      const response = await this.client.send(command);

      if (response?.AudioStream) {
        // @ts-ignore
        const audioBlob = await this.streamToBlob(response.AudioStream);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    };

    private streamToBlob = async (stream: ReadableStream<Uint8Array>): Promise<Blob> => {
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      let result;
    
      while (!(result = await reader.read()).done) {
        chunks.push(result.value);
      }
    
      return new Blob(chunks);
    };
}