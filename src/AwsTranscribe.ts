import {
    TranscribeStreamingClient,
    StartStreamTranscriptionCommand,
    AudioStream,
    LanguageCode,
  } from "@aws-sdk/client-transcribe-streaming";
import { AwsClientConfig } from "./AwsClientConfig";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { AsyncAudioInputStream } from "./AsyncAudioInputStream";

const SAMPLE_RATE = 44100;

export class AwsTranscribe {
    private config: AwsClientConfig;
    private mediaStream: MediaStream | undefined;
    private audioContext: AudioContext | undefined;
    private processor: ScriptProcessorNode | undefined;
    private audioInputStream: AsyncAudioInputStream | undefined;
    private client: TranscribeStreamingClient;

    constructor (config: AwsClientConfig) {
        this.config = config;
        this.client = new TranscribeStreamingClient({
            region: config.region,
            credentials: fromCognitoIdentityPool({
              clientConfig: { region: config.region },
              identityPoolId: config.identityPoolId,
            }),
        });
    }

    // Convert float audio data to 16-bit PCM
    private floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
      const buffer = new ArrayBuffer(input.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      return buffer;
    };

    startStreaming = async (onTranscript: (transcript: string) => void, inputLanguageId: string): Promise<void> => {

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported on your browser");
      }
      
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create an audio context
      this.audioContext = new AudioContext();
      const input = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create a script processor node to capture audio chunks
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      input.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      // Initialize AsyncAudioInputStream and Start Transcription
      this.audioInputStream = new AsyncAudioInputStream();
      this.processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0); // Get microphone data
        const pcmBuffer = this.floatTo16BitPCM(inputData);
        this.audioInputStream?.push(pcmBuffer);
      };
      
      // Set up Transcribe command
      const command = new StartStreamTranscriptionCommand({
        LanguageCode: inputLanguageId as LanguageCode,
        MediaSampleRateHertz: SAMPLE_RATE,
        MediaEncoding: "pcm",
        AudioStream: this.audioInputStream as AsyncIterable<AudioStream>
      });

      const response = await this.client.send(command);
      let alternativeTranscript = "";

      // Handle transcription results
      if (response.TranscriptResultStream) {
        for await (const event of response.TranscriptResultStream) {
          if (event.TranscriptEvent) {
            const transcripts = event.TranscriptEvent?.Transcript?.Results;
            transcripts?.forEach(async (result) => {
              if (!result.IsPartial && result.Alternatives && result.Alternatives.length > 0) {
                alternativeTranscript = result.Alternatives[0]?.Transcript || "";
                onTranscript(alternativeTranscript);
              }
            });
          }
        }
      }
    };
  
    stopStreaming = () => {
  
      if (this.processor) {
        this.processor.disconnect();
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      }

      if (this.audioContext) {
        this.audioContext.close();
      }
    };
}