
import React, { useState, useEffect } from 'react';
import { X, Save, Server, Key, Cpu, Globe, Wifi, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AIConfig, AIProvider } from '../types';
import { testAIConnection } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setLocalConfig(config);
    setTestStatus('idle');
    setErrorMsg('');
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setErrorMsg('');
    try {
        await testAIConnection(localConfig);
        setTestStatus('success');
        // Reset success message after 3 seconds
        setTimeout(() => setTestStatus('idle'), 3000);
    } catch (e: any) {
        setTestStatus('error');
        setErrorMsg(e.message || 'Connection failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-white/50 elevation-3 relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Server className="w-5 h-5 text-primary-500" />
            AI Configuration
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">AI Provider</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                    setLocalConfig({ ...localConfig, provider: 'google', modelName: 'gemini-3-flash-preview' });
                    setTestStatus('idle');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${localConfig.provider === 'google' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                <span className="font-bold">Google Gemini</span>
                <span className="text-[10px] opacity-70">Official SDK</span>
              </button>
              <button
                onClick={() => {
                    setLocalConfig({ ...localConfig, provider: 'custom', baseUrl: 'https://api.deepseek.com', modelName: 'deepseek-chat' });
                    setTestStatus('idle');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${localConfig.provider === 'custom' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                <span className="font-bold">OpenAI Compatible</span>
                <span className="text-[10px] opacity-70">DeepSeek / OpenAI / Local</span>
              </button>
            </div>
          </div>

          {/* Configuration Fields */}
          <div className="space-y-4">
            
            {/* API Key */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                    <Key className="w-3 h-3" /> API Key
                </label>
                <input 
                    type="password"
                    value={localConfig.apiKey}
                    onChange={(e) => {
                        setLocalConfig({...localConfig, apiKey: e.target.value});
                        setTestStatus('idle');
                    }}
                    placeholder={localConfig.provider === 'google' ? "Google AI Studio Key" : "sk-..."}
                    className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all shadow-sm"
                />
            </div>

            {/* Base URL (Custom only) */}
            {localConfig.provider === 'custom' && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Base URL
                    </label>
                    <input 
                        type="text"
                        value={localConfig.baseUrl || ''}
                        onChange={(e) => {
                            setLocalConfig({...localConfig, baseUrl: e.target.value});
                            setTestStatus('idle');
                        }}
                        placeholder="https://api.openai.com/v1"
                        className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all shadow-sm"
                    />
                    <p className="text-[10px] text-gray-400 px-1">Example: https://api.deepseek.com or http://localhost:11434/v1</p>
                </div>
            )}

            {/* Model Name */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> Model Name
                </label>
                <input 
                    type="text"
                    value={localConfig.modelName}
                    onChange={(e) => setLocalConfig({...localConfig, modelName: e.target.value})}
                    placeholder={localConfig.provider === 'google' ? "gemini-3-flash-preview" : "gpt-4o"}
                    className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all shadow-sm"
                />
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100/50 bg-gray-50/50 flex justify-between items-center">
          
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'loading' || !localConfig.apiKey}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                testStatus === 'success' ? 'bg-green-100 text-green-700' :
                testStatus === 'error' ? 'bg-red-100 text-red-700' :
                'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {testStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {testStatus === 'success' && <CheckCircle className="w-4 h-4" />}
            {testStatus === 'error' && <AlertCircle className="w-4 h-4" />}
            {testStatus === 'idle' && <Wifi className="w-4 h-4" />}
            
            {testStatus === 'loading' ? 'Testing...' : 
             testStatus === 'success' ? 'Connected' : 
             testStatus === 'error' ? 'Failed' : 'Test'}
          </button>

          <button 
            onClick={handleSave}
            className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
        
        {/* Error Message Toast */}
        {testStatus === 'error' && errorMsg && (
            <div className="px-6 pb-4 text-xs text-red-500 animate-in slide-in-from-top-1">
                {errorMsg}
            </div>
        )}

      </div>
    </div>
  );
};
