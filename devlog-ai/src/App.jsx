import { useState } from 'react';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  // API Key를 환경 변수에서 자동으로 가져옵니다.
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  const [mode, setMode] = useState('topic');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('API Key가 설정되지 않았습니다. 배포 환경 변수를 확인하세요.');
      return;
    }
    if (!input) {
      alert('내용을 입력해주세요!');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true 
      });

      // 1. 텍스트 생성
      const prompt = mode === 'topic' 
        ? `기술 블로그 주제: "${input}". 이 주제로 개발자 블로그 포스팅을 작성해줘. 서론, 본론, 결론, 예제 코드를 포함해서 마크다운 형식으로 깔끔하게.`
        : `다음 코드를 분석해서 기술 블로그 글을 작성해줘. 코드의 기능, 원리, 장점을 설명해줘.\n\n코드:\n${input}`;

      const textResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });
      
      const blogContent = textResponse.choices[0].message.content;

      // 2. 이미지 생성
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Minimalist tech blog thumbnail about ${input.slice(0, 30)}. flat design, pastel yellow and blue colors, vector art style.`,
        n: 1,
        size: "1024x1024",
      });

      setResult({
        text: blogContent,
        image: imageResponse.data[0].url
      });

    } catch (err) {
      console.error(err);
      setError('생성 중 오류가 발생했습니다. (API Quota 등을 확인하세요)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>DevLog.ai</h1>
        <p>개발자의 성장을 돕는 AI 글쓰기 파트너</p>
      </header>

      <div className="main-card">
        <div className="tabs">
          <button 
            className={mode === 'topic' ? 'active' : ''} 
            onClick={() => setMode('topic')}
          >
            💡 주제로 생성
          </button>
          <button 
            className={mode === 'code' ? 'active' : ''} 
            onClick={() => setMode('code')}
          >
            💻 코드로 생성
          </button>
        </div>

        {mode === 'topic' ? (
          <input 
            className="main-input"
            placeholder="블로그 주제를 입력하세요 (예: React Query 도입기)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        ) : (
          <textarea 
            className="main-textarea"
            placeholder="설명할 코드를 붙여넣으세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        )}

        <button 
          className="generate-btn" 
          onClick={handleGenerate} 
          disabled={loading}
        >
          {loading ? 'AI가 열심히 생성 중... ⏳' : '✨ 블로그 글 & 썸네일 생성하기'}
        </button>

        {error && <p className="error-msg">{error}</p>}
      </div>

      {result && (
        <div className="result-area">
          <div className="result-card">
            <h3>🖼 생성된 썸네일</h3>
            <img src={result.image} alt="Thumbnail" className="thumbnail" />
            <p className="download-hint">*우클릭하여 저장하세요</p>
          </div>
          <div className="result-card wide">
            <h3>📝 생성된 초안</h3>
            <div className="markdown-body">
              <ReactMarkdown>{result.text}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;