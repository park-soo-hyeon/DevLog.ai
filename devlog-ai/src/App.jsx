import { useState } from 'react';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  const [mode, setMode] = useState('topic');
  const [input, setInput] = useState('');
  
  const [tone, setTone] = useState('friendly'); 
  const [target, setTarget] = useState('beginner'); 
  const [language, setLanguage] = useState('Korean'); // 기본값 한국어

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

      // 1. 옵션 프롬프트 설정
      let tonePrompt = "";
      if (tone === 'friendly') tonePrompt = "친근하고 유머러스한 말투(이모지 많이 사용)";
      else if (tone === 'professional') tonePrompt = "진지하고 전문적인 기술 문서 스타일";
      else if (tone === 'simple') tonePrompt = "비유를 사용하여 아주 쉽게 설명하는 스타일";

      let targetPrompt = "";
      if (target === 'beginner') targetPrompt = "비전공자나 주니어 개발자도 이해하기 쉽게";
      else if (target === 'senior') targetPrompt = "깊이 있는 기술적 원리를 포함하여 시니어 개발자 타겟으로";

      let langPrompt = "";
      if (language === 'Korean') langPrompt = "Must write in Korean language (반드시 한국어로 작성해).";
      else if (language === 'English') langPrompt = "Must write in English language.";
      else if (language === 'Japanese') langPrompt = "Must write in Japanese language.";

      // 2. 최종 프롬프트 조합
      const prompt = mode === 'topic' 
        ? `기술 블로그 주제: "${input}". 
           조건 1: ${langPrompt}
           조건 2: ${tonePrompt}로 작성해.
           조건 3: ${targetPrompt} 맞춰서 설명해.
           조건 4: 서론, 본론, 결론, 예제 코드를 포함해서 마크다운 형식으로 구조화해.`
        : `다음 코드를 분석해서 기술 블로그 글을 작성해줘. 
           코드: \n${input}\n
           조건 1: ${langPrompt} (코드 주석도 해당 언어로 번역).
           조건 2: ${tonePrompt}로 작성해.
           조건 3: ${targetPrompt} 맞춰서 설명해.`;

      const textResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });
      
      const blogContent = textResponse.choices[0].message.content;

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Minimalist tech blog thumbnail about ${input.slice(0, 30)}. flat design, pastel yellow and blue colors, vector art style, no text.`,
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

  const handleCopy = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      alert("클립보드에 복사되었습니다! 블로그에 붙여넣으세요. 🎉");
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

        <div className="options-grid">
          <div className="option-group">
            <label>글 스타일 (Tone)</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="friendly">😊 친근한 스타일</option>
              <option value="professional">🧐 전문적인 스타일</option>
              <option value="simple">👶 쉬운 설명 스타일</option>
            </select>
          </div>
          <div className="option-group">
            <label>독자 대상 (Target)</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="beginner">🌱 주니어/입문자</option>
              <option value="senior">🌳 시니어/전문가</option>
            </select>
          </div>
          
          <div className="option-group">
            <label>출력 언어 (Language)</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="Korean">🇰🇷 한국어</option>
              <option value="English">🇺🇸 English</option>
              <option value="Japanese">🇯🇵 日本語</option>
            </select>
          </div>
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
          {loading ? 'AI가 열심히 글을 쓰고 그림을 그리는 중... 🎨' : '✨ 블로그 글 & 썸네일 생성하기'}
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
            <div className="result-header-row">
              <h3>📝 생성된 초안</h3>
              <button onClick={handleCopy} className="copy-btn">📋 복사하기</button>
            </div>
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