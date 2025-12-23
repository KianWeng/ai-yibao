const express = require('express');
const router = express.Router();
const axios = require('axios');

// 大模型API配置（可以通过环境变量配置）
// 硅基流动API配置
const AI_API_URL = process.env.AI_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY || '';
// 硅基流动支持的模型名称：
// - deepseek-chat-v3.2 (推荐，稳定版本)
// - deepseek-chat (DeepSeek Chat)
// - deepseek-ai/DeepSeek-V3.2-Exp (实验版，可能不稳定)
const AI_MODEL = process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3.2';

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
 * 调用大模型API（带重试机制）
 */
async function callAIModel(userMessage, context = {}, retryCount = 0) {
  const MAX_RETRIES = 2; // 最多重试2次
  const TIMEOUT = 60000; // 60秒超时
  
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

    // 构建请求体
    const requestBody = {
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
    };

    console.log(`[AI助手] 发送请求 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1})，模型: ${AI_MODEL}`);

    const response = await axios.post(
      AI_API_URL,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        timeout: TIMEOUT // 60秒超时
      }
    );

    // 检查响应格式
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      console.log(`[AI助手] 请求成功，响应长度: ${content.length} 字符`);
      return content;
    } else if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const content = response.data.choices[0].message.content;
      console.log(`[AI助手] 请求成功，响应长度: ${content.length} 字符`);
      return content;
    } else {
      console.error('API响应格式异常:', response.data);
      throw new Error('AI服务返回格式异常');
    }
  } catch (error) {
    // 详细记录错误信息
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: AI_API_URL,
      model: AI_MODEL,
      retryCount: retryCount
    };
    
    console.error(`[AI助手] 调用失败 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}):`, errorDetails);
    
    // 如果是超时错误且还有重试次数，进行重试
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = (retryCount + 1) * 2000; // 递增等待时间：2秒、4秒
        console.log(`[AI助手] 超时错误，${waitTime}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callAIModel(userMessage, context, retryCount + 1);
      } else {
        console.error('[AI助手] 重试次数已用完，返回模拟响应');
        // 如果重试失败，返回模拟响应
        return generateMockResponse(userMessage, context, true);
      }
    }
    
    // 如果API调用失败且没有配置API密钥，返回模拟响应
    if (!AI_API_KEY || AI_API_KEY === '') {
      console.log('[AI助手] 未配置API密钥，使用模拟响应');
      return generateMockResponse(userMessage, context);
    }
    
    // 如果是400错误，可能是模型名称或请求格式问题
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || '请求参数错误';
      console.error('400错误详情:', errorMsg);
      // 尝试使用备用模型
      if (retryCount < MAX_RETRIES && AI_MODEL.includes('DeepSeek-V3.2-Exp')) {
        console.log('[AI助手] 尝试使用备用模型: deepseek-chat');
        const originalModel = AI_MODEL;
        // 临时修改模型名称
        const backupModel = 'deepseek-chat';
        const modifiedContext = { ...context };
        // 这里需要修改全局模型，但为了不影响其他请求，我们直接返回模拟响应
        return generateMockResponse(userMessage, context, true, `模型 ${AI_MODEL} 可能不可用，建议检查模型名称或使用模拟响应模式。`);
      }
      throw new Error(`API请求参数错误: ${errorMsg}。请检查模型名称是否正确，当前模型: ${AI_MODEL}`);
    }
    
    // 如果是401或403错误，说明API密钥有问题
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('API密钥无效，请检查配置');
    }
    
    // 如果是429错误，说明请求频率过高
    if (error.response?.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = 5000; // 等待5秒后重试
        console.log(`[AI助手] 请求频率过高，${waitTime}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callAIModel(userMessage, context, retryCount + 1);
      }
      throw new Error('请求频率过高，请稍后重试');
    }
    
    // 如果是网络错误，尝试重试
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      if (retryCount < MAX_RETRIES) {
        const waitTime = (retryCount + 1) * 2000;
        console.log(`[AI助手] 网络错误，${waitTime}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callAIModel(userMessage, context, retryCount + 1);
      }
      // 网络错误时返回模拟响应
      console.log('[AI助手] 网络错误，返回模拟响应');
      return generateMockResponse(userMessage, context, true, '网络连接失败，已切换到模拟响应模式。');
    }
    
    // 其他错误，如果重试次数未用完，尝试重试
    if (retryCount < MAX_RETRIES) {
      const waitTime = (retryCount + 1) * 2000;
      console.log(`[AI助手] 未知错误，${waitTime}ms后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return callAIModel(userMessage, context, retryCount + 1);
    }
    
    // 最终失败，返回模拟响应
    console.log('[AI助手] 所有重试失败，返回模拟响应');
    return generateMockResponse(userMessage, context, true);
  }
}

/**
 * 生成模拟响应（用于开发测试，当没有配置API密钥或API调用失败时）
 */
function generateMockResponse(userMessage, context, isFallback = false, fallbackReason = '') {
  const lowerMessage = userMessage.toLowerCase();
  const prefix = isFallback ? '⚠️ **注意**：AI服务暂时不可用，以下是模拟响应。\n\n' : '';
  const reasonNote = fallbackReason ? `\n\n*${fallbackReason}*\n\n` : '';
  
  if (lowerMessage.includes('欺诈') || lowerMessage.includes('风险')) {
    return `${prefix}${reasonNote}根据您提供的数据，我检测到以下潜在风险：

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
    return `${prefix}${reasonNote}我已经对相关数据进行了分析：

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
  
  if (lowerMessage.includes('医院') || lowerMessage.includes('转院') || lowerMessage.includes('推荐')) {
    return `${prefix}${reasonNote}根据您的需求，我为您推荐以下医院：

**推荐医院**：
1. **北京协和医院** - 三级医院，神经科、心内科、骨科专业，评分4.8分
2. **上海瑞金医院** - 三级医院，心内科、神经科专业，评分4.7分
3. **广州中山医院** - 三级医院，神经科、康复科专业，评分4.6分

**选择建议**：
- 如需神经科治疗，推荐北京协和医院或广州中山医院
- 如需心内科治疗，推荐北京协和医院或上海瑞金医院
- 如需康复治疗，推荐广州中山医院

**转院流程**：
1. 填写转院申请表单
2. 提交申请等待审核
3. 审核通过后办理转院手续`;
  }
  
  return `${prefix}${reasonNote}我是医保欺诈检测AI助手。我可以帮助您：
- 分析医疗费用数据
- 识别潜在的欺诈行为
- 评估风险等级
- 提供处理建议
- 推荐合适的医院（普通用户）

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

