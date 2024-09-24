import React, { useState } from 'react';
import { Select } from 'antd';

interface LanguageOption {
  label: string;
  value: string;
}

interface LanguageSelectProps {
  onLanguageSelected: (language: string) => void;
  defaultValue?: string;
  disabled?: boolean
}

export enum Languages {
    Italian = 'it-IT',
    English = 'en-GB',
    Spanish = 'es-ES',
    German = 'de-DE',
    Finnish = 'fi-FI',
    Japanese = 'ja-JP',
    French = 'fr-FR',
    Czech = 'cs-CS'
}

const languageOptions: LanguageOption[] = [
  { label: 'Italian', value: Languages.Italian },
  { label: 'English', value: Languages.English },
  { label: 'Spanish', value:Languages.Spanish },
  { label: 'German', value: Languages.German },
  { label: 'Finnish', value: Languages.Finnish },  
  { label: 'Japanese', value: Languages.Japanese }, 
  { label: 'French', value: Languages.French },
  { label: 'Czech', value: Languages.Czech }
];

const LanguageSelect: React.FC<LanguageSelectProps> = ({ onLanguageSelected, defaultValue, disabled }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);

  const handleChange = (value: string) => {
    setSelectedLanguage(value);
    onLanguageSelected(value);
  };

  return (
    <Select
      showSearch
      style={{ width: 300 }}
      placeholder="Select a language"
      optionFilterProp="children"
      onChange={handleChange}
      defaultValue={defaultValue}
      disabled={disabled}
      filterOption={(input, option) => {
        if (!option || !option.children) return false;

        const children = typeof option.children === 'string' ? option.children : '';
        return children.toLowerCase().includes(input.toLowerCase());
      }}
      value={selectedLanguage}
    >
      {languageOptions.map((lang) => (
        <Select.Option key={lang.value} value={lang.value}>
          {lang.label}
        </Select.Option>
      ))}
    </Select>
  );
};

export default LanguageSelect;
