import React, { useRef, useState } from "react";
/*
import {
  StartStreamTranscriptionCommand,
  AudioStream,
} from "@aws-sdk/client-transcribe-streaming";
 */
import { VoiceId } from "@aws-sdk/client-polly";
import { Button, Select, Typography, Spin } from "antd";

import { AwsTranscribe } from "./AwsTranscribe";
import { AwsTranslate } from "./AwsTranslate";
import { AwsPolly } from "./AwsPolly";


const { Option } = Select;
const { Title, Paragraph } = Typography;

const REGION = "eu-west-1"; // Set your AWS region
const IDENTITY_POOL_ID = "eu-west-1:d7204e8f-bf1a-4725-9a15-ca563aeaa662";
const INPUT_LANGUAGE_CODE_ID = "it-IT";
const OUTPUT_LANGUAGE_CODE_ID = "en-EN";
//const SAMPLE_RATE = 44100;


const App: React.FC = () => {
  const [transcription, setTranscription] = useState<string>("");
  const [translation, setTranslation] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId>("Joanna");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
 
  const polly = new AwsPolly({
    region: REGION, 
    identityPoolId: IDENTITY_POOL_ID,
    voiceId: voiceId
  });

  const translate = new AwsTranslate({
    region: REGION, 
    identityPoolId: IDENTITY_POOL_ID, 
    inputLanguageId: INPUT_LANGUAGE_CODE_ID, 
    outputLanguageId: OUTPUT_LANGUAGE_CODE_ID
  });

  const transcribe = new AwsTranscribe({
    region: REGION, 
    identityPoolId: IDENTITY_POOL_ID,
    inputLanguageId: INPUT_LANGUAGE_CODE_ID
  });

  // Start recording and transcription
  const startRecording = async () => {
    setTranscription("");
    setTranslation("");

    try {


      await transcribe.startStreaming(async (transcript) => {
        if (transcript) {
          setTranscription((prev) => prev + " " + transcript);
          await invokePolly(transcript);
        }
      });


    } catch (error) {
      console.error("Error during transcription: ", error);
    }
  };

  const invokeTranslate = async (text: string): Promise<string> => {
    try {
      return await translate.translate(text);
    } catch (error) {
      console.error("Error during translation: ", error);
      return text; // Fallback to original text
    }
  };
  
  const invokePolly = async (text: string) => {
    try {
      setLoading(true);
      const translatedText = await invokeTranslate(text); // Translate the text before passing to Polly
      polly.speech(translatedText)
      setTranslation((prev) => prev + " " + translatedText);
    } catch (error) {
      console.error("Error during Polly synthesis: ", error);
    } finally {
      setLoading(false);
    }
  };
  


  // Stop recording and release resources
  const stopRecording =  () => {
    setTranscription("");
    setTranslation("");
    transcribe.stopStreaming();
    setIsRecording(false);
  };


  return (
    <div className="App" style={{ padding: '20px' }}>
      <Title>Real-Time Speech Translator</Title>
      <Select
        defaultValue="Joanna"
        style={{ width: 120, marginBottom: '20px' }}
        onChange={setVoiceId}
      >
        <Option value="Joanna">Female</Option>
        <Option value="Matthew">Male</Option>
      </Select>
      <br />
      <Button
        type="primary"
        onClick={() => { setIsRecording(!isRecording); isRecording ? stopRecording() : startRecording(); }}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </Button>
      {loading && <Spin style={{ marginLeft: '10px' }} />}
      <div>
        <Title level={3}>Transcription:</Title>
        <Paragraph>{transcription}</Paragraph>
      </div>
      <div>
        <Title level={3}>Translation:</Title>
        <Paragraph>{translation}</Paragraph>
      </div>
    </div>
  );
};


export default App;
