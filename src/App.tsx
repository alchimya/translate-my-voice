import React, { useEffect, useRef, useState } from "react";
import { VoiceId } from "@aws-sdk/client-polly";
import { Button, Select, Typography, Spin, Row, Col, Form, Input } from "antd";

import { AwsTranscribe } from "./AwsTranscribe";
import { AwsTranslate } from "./AwsTranslate";
import { AwsPolly } from "./AwsPolly";
import LanguageSelect, { Languages } from "./LanguageSelect";
import { VoicesInfo, VoicesInfoTypes, VoicesMap } from "./Voices";


const { Option } = Select;
const { Title, Paragraph } = Typography;

const REGION = "eu-west-1";
const IDENTITY_POOL_ID = "eu-west-1:d7204e8f-bf1a-4725-9a15-ca563aeaa662";

const App: React.FC = () => {
  const defaultOutputLanguage = Languages.Italian;
  const [transcription, setTranscription] = useState<string>("");
  const [translation, setTranslation] = useState<string>("");
  const [inputLanguage, setInputLanguage] = useState<string>(Languages.English);
  const [outputLanguage, setOutputLanguage] = useState<string>(defaultOutputLanguage);
  const [outputVoices, setOutputVoices] = useState<VoicesInfo>( VoicesMap[defaultOutputLanguage]);
  const [outputVoiceId, setOutputVoiceId] = useState<VoiceId>(outputVoices.female);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
 
  const pollyeRef = useRef<AwsPolly | null>(null);
  const translateRef = useRef<AwsTranslate | null>(null);
  const transcribeRef = useRef<AwsTranscribe | null>(null);
  
 
  useEffect(() => {
    const initializeTranscribe = async () => {
      try {
        
        pollyeRef.current = new AwsPolly({
          region: REGION, 
          identityPoolId: IDENTITY_POOL_ID
        });
        
        translateRef.current = new AwsTranslate({
          region: REGION, 
          identityPoolId: IDENTITY_POOL_ID,
        });
      
        transcribeRef.current = new AwsTranscribe({
          region: REGION,
          identityPoolId: IDENTITY_POOL_ID
        });

      } catch (error) {
        console.error('Failed to initialize AwsTranscribe:', error);
        // Handle the error appropriately (e.g., show an error message to the user)
      }
    };

    initializeTranscribe();

  }, []); 

  // Start recording and transcription
  const startRecording = async () => {
    setTranscription("");
    setTranslation("");

    try {
      await transcribeRef.current?.startStreaming(async (transcript) => {
        if (transcript) {
          setTranscription((prev) => prev + " " + transcript);
          await invokePolly(transcript);
        }
      }, inputLanguage);
    } catch (error) {
      console.error("Error during transcription: ", error);
    }
  };

  const invokeTranslate = async (text: string): Promise<string> => {
    try {
      return await translateRef.current?.translate(text, inputLanguage, outputLanguage) || "";
    } catch (error) {
      console.error("Error during translation: ", error);
      return text;
    }
  };
  
  const invokePolly = async (text: string) => {
    try {
      setLoading(true);
      const translatedText = await invokeTranslate(text); // Translate the text before passing to Polly
      pollyeRef.current?.speech(translatedText, outputVoiceId)
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
    transcribeRef.current?.stopStreaming();
    setIsRecording(false);
  };


  return (
    <div className="App" style={{ padding: '20px' }}>
      <Title>Real-Time Speech Translator</Title>
      <Form
      name="myForm"
      layout="vertical"
    >
    <Form.Item
      label="Input Language" 
      name="inputLanguage"
    >
      <LanguageSelect disabled={isRecording} defaultValue={inputLanguage} onLanguageSelected={setInputLanguage}/>
    </Form.Item>
    <Form.Item
      label="Output Language" 
      name="outputLanguage"
    >
      <LanguageSelect disabled={isRecording} defaultValue={outputLanguage} onLanguageSelected={(language)=>{
        setOutputLanguage(language);
        setOutputVoices(VoicesMap[language]);
      }}/>
    </Form.Item>
     <Form.Item
        label="Output Voice Style" 
        name="voiceStyle"
      >
        <Select
          defaultValue={outputVoices.female}
          style={{ width: 120, marginBottom: '20px' }}
          onChange={setOutputVoiceId}
          disabled={isRecording}
        >
          <Option  disabled={outputVoices.unsupported?.includes(VoicesInfoTypes.female)} value={outputVoices.female}>Female</Option>
          <Option disabled={outputVoices.unsupported?.includes(VoicesInfoTypes.male)} value={outputVoices.male}>Male</Option>
        </Select>
      </Form.Item>
    </Form>

      <Button
        type="primary"
        onClick={() => { setIsRecording(!isRecording); isRecording ? stopRecording() : startRecording(); }}
      >
        {isRecording ? "Stop Speech" : "Start Speech"}
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
