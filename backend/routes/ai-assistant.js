const express = require('express');
const router = express.Router();
const axios = require('axios');

// 大模型API配置（可以通过环境变量配置）
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';

// 医保欺诈检测的系统提示词（管理员使用）
const SYSTEM_PROMPT_ADMIN = `你是一位专业的医保欺诈检测AI助手。你的职责是：
1. 分析医疗费用数据，识别潜在的欺诈行为
2. 检测异常模式，如虚假住院、过度医疗、重复收费等
3. 提供详细的风险评估报告
4. 给出专业的建议和处理方案

请用专业、准确、简洁的语言回答用户的问题。`;

// 转院建议的系统提示词（普通用户使用）
const SYSTEM_PROMPT_USER = `你是一位专业的转院建议AI助手。你的职责是：
1. 根据用户的病情、需求和预算，推荐合适的医院
2. 分析医院的专业特长、评价、价格等因素
3. 提供详细的转院建议和医院对比
4. 回答用户关于转院流程、费用、注意事项等问题

请用专业、准确、简洁的语言回答用户的问题。如果用户提供了医院列表，请基于这些医院信息给出建议。`;

/**
 * 调用大模型API
 */
async function callAIModel(userMessage, context = {}) {
  try {
    // 根据用户角色选择系统提示词
    const userRole = context.userRole || 'admin';
    const systemPrompt = userRole === 'user' ? SYSTEM_PROMPT_USER : SYSTEM_PROMPT_ADMIN;
    
    // 构建消息内容
    let fullMessage = userMessage;
    
    // 如果有上下文数据，添加到消息中
    if (context.patientData) {
      fullMessage += `\n\n相关数据：\n${JSON.stringify(context.patientData, null, 2)}`;
    }
    
    if (context.riskEvents) {
      fullMessage += `\n\n风险事件：\n${JSON.stringify(context.riskEvents, null, 2)}`;
    }
    
    // 如果是普通用户，添加医院列表信息
    if (userRole === 'user' && context.hospitals && context.hospitals.length > 0) {
      fullMessage += `\n\n可选医院列表：\n${JSON.stringify(context.hospitals, null, 2)}`;
    }

    const response = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: fullMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        timeout: 30000 // 30秒超时
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('调用大模型API失败:', error.response?.data || error.message);
    
    // 如果API调用失败，返回模拟响应（用于开发测试）
    if (!AI_API_KEY || AI_API_KEY === '') {
      return generateMockResponse(userMessage, context);
    }
    
    throw new Error('AI服务暂时不可用，请稍后重试');
  }
}

/**
 * 生成模拟响应（用于开发测试，当没有配置API密钥时）
 */
function generateMockResponse(userMessage, context) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('欺诈') || lowerMessage.includes('风险')) {
    return `根据您提供的数据，我检测到以下潜在风险：

1. **异常费用模式**：检测到多笔高额费用集中在短时间内，可能存在虚假住院或过度医疗的情况。

2. **重复收费风险**：发现部分项目存在重复计费的可能，建议进一步核实。

3. **建议措施**：
   - 对相关病例进行详细审核
   - 联系医疗机构核实具体情况
   - 必要时启动调查程序

风险等级：中等
建议优先级：高`;
  }
  
  if (lowerMessage.includes('分析') || lowerMessage.includes('评估')) {
    return `我已经对相关数据进行了分析：

**数据分析结果**：
- 费用趋势：较上月增长15%，需要关注
- 风险事件：发现3起潜在风险事件
- 异常模式：检测到2个异常费用模式

**风险评估**：
- 高风险：1起
- 中风险：2起
- 低风险：0起

**建议**：
建议优先处理高风险事件，并加强对相关医疗机构的监管。`;
  }
  
  return `我是医保欺诈检测AI助手。我可以帮助您：
- 分析医疗费用数据
- 识别潜在的欺诈行为
- 评估风险等级
- 提供处理建议

请告诉我您需要分析的具体问题或数据。`;
}

/**
 * POST /api/ai-assistant/chat
 * 与AI助手对话
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '请输入有效的问题',
        data: null
      });
    }

    // 调用大模型
    const aiResponse = await callAIModel(message, context || {});
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        response: aiResponse,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI助手处理失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '服务器错误',
      data: null
    });
  }
});

/**
 * POST /api/ai-assistant/analyze
 * 分析风险数据
 */
router.post('/analyze', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        code: 400,
        message: '请提供要分析的数据',
        data: null
      });
    }

    const analysisPrompt = `请对以下医保数据进行深度分析，识别潜在的欺诈风险：

${JSON.stringify(data, null, 2)}

请提供：
1. 风险识别结果
2. 风险等级评估
3. 异常模式分析
4. 处理建议`;

    const aiResponse = await callAIModel(analysisPrompt, { patientData: data });
    
    res.json({
      code: 200,
      message: '分析完成',
      data: {
        analysis: aiResponse,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('数据分析失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '服务器错误',
      data: null
    });
  }
});

/**
 * GET /api/ai-assistant/health
 * 检查AI服务健康状态
 */
router.get('/health', async (req, res) => {
  try {
    const hasApiKey = AI_API_KEY && AI_API_KEY !== '';
    
    res.json({
      code: 200,
      message: '服务正常',
      data: {
        status: 'ok',
        hasApiKey: hasApiKey,
        apiUrl: AI_API_URL,
        model: AI_MODEL,
        mode: hasApiKey ? 'production' : 'mock'
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务异常',
      data: null
    });
  }
});

module.exports = router;

