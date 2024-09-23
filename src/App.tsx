import React, { useEffect, useRef, useState } from "react";
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  AudioStream,
} from "@aws-sdk/client-transcribe-streaming";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { PollyClient, SynthesizeSpeechCommand, VoiceId } from "@aws-sdk/client-polly";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const REGION = "eu-west-1"; // Set your AWS region
const IDENTITY_POOL_ID = "eu-west-1:d7204e8f-bf1a-4725-9a15-ca563aeaa662"; // Set your Cognito Identity Pool ID
const INPUT_LANGUAGE_CODE_ID = "it-IT";
const OUTPUT_LANGUAGE_CODE_ID = "en-EN";
const SAMPLE_RATE = 44100;
//const VOICE_ID = "Matthew"//"Joanna";

const App: React.FC = () => {
  const [transcription, setTranscription] = useState<string>("");
  const [translation, setTranslation] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId>("Joanna");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const transcribeClientRef = useRef<TranscribeStreamingClient | null>(null);
  const audioInputStreamRef = useRef<AsyncAudioInputStream | null>(null);
  const pollyClientRef = useRef<PollyClient | null>(null);
  const translateClientRef = useRef<TranslateClient | null>(null);


  // Start recording and transcription
  const startRecording = async () => {
    setTranscription("");
    setTranslation("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not supported on your browser!");
      return;
    }

    try {
      // Initialize AWS Transcribe Client
      transcribeClientRef.current = new TranscribeStreamingClient({
        region: REGION,
        credentials: fromCognitoIdentityPool({
          clientConfig: { region: REGION },
          identityPoolId: IDENTITY_POOL_ID,
        }),
      });
      pollyClientRef.current = new PollyClient({
        region: REGION,
        credentials: fromCognitoIdentityPool({
          clientConfig: { region: REGION },
          identityPoolId: IDENTITY_POOL_ID,
        }),
      });
      translateClientRef.current = new TranslateClient({
        region: REGION,
        credentials: fromCognitoIdentityPool({
          clientConfig: { region: REGION },
          identityPoolId: IDENTITY_POOL_ID,
        }),
      });
      // Get microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create an audio context
      audioContextRef.current = new AudioContext();
      const input = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);

      // Create a script processor node to capture audio chunks
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      input.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // Initialize AsyncAudioInputStream and Start Transcription
      audioInputStreamRef.current = new AsyncAudioInputStream();
      processorRef.current.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0); // Get microphone data
        const pcmBuffer = floatTo16BitPCM(inputData);
        audioInputStreamRef.current?.push(pcmBuffer);
      };

      // Set up Transcribe command
      const command = new StartStreamTranscriptionCommand({
        LanguageCode: INPUT_LANGUAGE_CODE_ID,
        MediaSampleRateHertz: SAMPLE_RATE,
        MediaEncoding: "pcm",
        AudioStream: audioInputStreamRef.current as AsyncIterable<AudioStream>, // Pass AsyncIterable instead of ReadableStream
      });

      const response = await transcribeClientRef.current.send(command);
      

      // Handle transcription results
      if (response.TranscriptResultStream) {
        for await (const event of response.TranscriptResultStream) {
          if (event.TranscriptEvent) {
            const transcripts = event.TranscriptEvent?.Transcript?.Results;
            transcripts?.forEach(async (result) => {
              // Check if result.Alternatives is an array and has at least one item
              if (!result.IsPartial && result.Alternatives && result.Alternatives.length > 0) {
                const alternativeTranscript = result.Alternatives[0]?.Transcript;
                if (alternativeTranscript) {
                  setTranscription((prev) => prev + " " + alternativeTranscript);
                  await invokePolly(alternativeTranscript);
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Error during transcription: ", error);
    }
  };

  const invokeTranslate = async (text: string): Promise<string> => {
    try {
      const command = new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: INPUT_LANGUAGE_CODE_ID, // you can also use 'auto'
        TargetLanguageCode: OUTPUT_LANGUAGE_CODE_ID,
      });
  
      const response = await translateClientRef.current?.send(command);
      return response?.TranslatedText || text; // Return translated text or original if fails
    } catch (error) {
      console.error("Error during translation: ", error);
      return text; // Fallback to original text
    }
  };
  
  const invokePolly = async (text: string) => {
    try {
      const translatedText = await invokeTranslate(text); // Translate the text before passing to Polly
      setTranslation((prev) => prev + " " + translatedText);

      const command = new SynthesizeSpeechCommand({
        OutputFormat: "mp3", // Use lowercase
        Text: translatedText,
        Engine: "neural",
        VoiceId: voiceId, // Choose a voice from the available Polly voices
      });

      const response = await pollyClientRef.current?.send(command);

      if (response?.AudioStream) {
        // @ts-ignore
        const audioBlob = await streamToBlob(response.AudioStream);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play(); // Play the audio
      }
    } catch (error) {
      console.error("Error during Polly synthesis: ", error);
    }
  };
  
  // Helper function to convert the stream to a Blob
  const streamToBlob = async (stream: ReadableStream<Uint8Array>): Promise<Blob> => {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let result;
  
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }
  
    return new Blob(chunks); // Convert chunks to Blob
  };
  

  // Stop recording and release resources
  const stopRecording = () => {
    setTranscription("");
    setTranslation("");
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
  };

  // Convert float audio data to 16-bit PCM
  const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  return (
    <div className="App">
      <h1>Amazon Transcribe Demo</h1>
      <button onClick={() => { setIsRecording(!isRecording); isRecording ? stopRecording() : startRecording(); }}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <div>
        <h3>Choose Voice:</h3>
        <select value={voiceId} onChange={(e) => setVoiceId(e.target.value as VoiceId)}>
          <option value="Joanna">Female</option>
          <option value="Matthew">Male</option>
        </select>
      </div>
      <div>
        <h3>Transcription:</h3>
        <p>{transcription}</p>
      </div>
      <div>
        <h3>Translation:</h3>
        <p>{translation}</p>
      </div>
    </div>
  );
};

// AsyncAudioInputStream class to handle audio stream as AsyncIterable
class AsyncAudioInputStream implements AsyncIterable<AudioStream> {
  private buffer: Uint8Array[] = [];
  private closed = false;

  public async *[Symbol.asyncIterator](): AsyncIterator<AudioStream> {
    while (!this.closed || this.buffer.length > 0) {
      if (this.buffer.length > 0) {
        const chunk = this.buffer.shift() as Uint8Array;
        // Wrap the Uint8Array into an object conforming to AudioStream
        yield { AudioEvent: { AudioChunk: chunk } };
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simple backoff mechanism
      }
    }
  }

  public push(data: ArrayBuffer): void {
    this.buffer.push(new Uint8Array(data));
  }

  public close(): void {
    this.closed = true;
  }
}

export default App;
