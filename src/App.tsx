import React, { useEffect, useRef, useState } from "react";
import './App.css'; 
import { VoiceId } from "@aws-sdk/client-polly";
import { Button, Select, Typography, Spin, Form, Row, Col, Space } from "antd";

import { AwsTranscribe } from "./AwsTranscribe";
import { AwsTranslate } from "./AwsTranslate";
import { AwsPolly } from "./AwsPolly";

import LanguageSelect, { Languages } from "./LanguageSelect";
import { VoicesInfo, VoicesInfoTypes, VoicesMap } from "./Voices";
import { Environment } from "./Environment";
import { AwsClientConfig } from "./AwsClientConfig";


const { Option } = Select;
const { Title } = Typography;

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
  
  const environment = new Environment();
 
  useEffect(() => {
    const initializeTranscribe = async () => {
      try {
        const awsClientConfig: AwsClientConfig = {
          region: environment.region, 
          identityPoolId: environment.identityPoolId
        }

        pollyeRef.current = new AwsPolly(awsClientConfig);
        translateRef.current = new AwsTranslate(awsClientConfig);
        transcribeRef.current = new AwsTranscribe(awsClientConfig);

      } catch (error) {
          console.error('Failed to initialize AwsTranscribe:', error);
      }
    };

    initializeTranscribe();

  }, []); 

  const startRecording = async () => {
    setTranscription("");
    setTranslation("");
    try {
      await transcribeRef.current?.startStreaming(async (transcript) => {
        if (transcript) {
          setTranscription((prev) => prev + (prev && "\n") + transcript);
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
      setTranslation((prev) => prev + (prev && "\n") + translatedText);
    } catch (error) {
      console.error("Error during Polly synthesis: ", error);
    } finally {
      setLoading(false);
    }
  };
  
  const stopRecording =  () => {
    setTranscription("");
    setTranslation("");
    transcribeRef.current?.stopStreaming();
    setIsRecording(false);
  };

  return (
    <div className="App" style={{ padding: '20px' }}>
      <Title style={{textAlign: "center", background: "#bab6b3"}}>Real-Time Speech Translator</Title>
      <Form
        name="speechPanelForm"
        layout="vertical"
      >
        <Row>
          <Col span={8}>
            <Row>
              <Col>
                <Form.Item label="Input Language" name="inputLanguage">
                  <LanguageSelect disabled={isRecording} defaultValue={inputLanguage} onLanguageSelected={setInputLanguage}/>
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Item label="Output Language" name="outputLanguage">
                  <LanguageSelect disabled={isRecording} defaultValue={outputLanguage} onLanguageSelected={(language)=>{
                    setOutputLanguage(language);
                    setOutputVoices(VoicesMap[language]);
                  }}/>
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Item label="Output Voice Style" name="voiceStyle">
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
              </Col>
            </Row>
            <Row>
            <Col>
              <Button
                type="primary"
                onClick={() => { setIsRecording(!isRecording); isRecording ? stopRecording() : startRecording(); }}
              >
                {isRecording ? "Stop Speech" : "Start Speech"}
              </Button>
              {loading && <Spin style={{ marginLeft: '10px' }} />}
            </Col>
            </Row>
          </Col>
          <Col span={16}>
            <Row gutter={16}>
              <Col span={12}>
                <Title level={3}>Your Voice {inputLanguage}</Title>
                <pre className="paragraph-with-scrollbar">
                    {transcription}
                </pre>
              </Col>
              <Col span={12}>
                <Title level={3}>Translation</Title>
                <pre className="paragraph-with-scrollbar">
                  {translation}
                </pre>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
    </div>
  );
};


export default App;
