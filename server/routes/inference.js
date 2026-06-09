/**
 * 对外推理 API - 简洁的第三方调用接口
 * 适合其他服务直接调用进行行动项抽取，无需先导入会议
 */
const express = require('express');
const router = express.Router();
const { ok, fail, asyncHandler } = require('../utils/common');
const extraction = require('../services/extractionService');
const meetingSvc = require('../services/meetingService');
const queue = require('../queue');
const monitoring = require('../monitoring');
const config = require('../config');

router.post('/extract', asyncHandler(async (req, res) => {
  const { transcript, segments, meeting_title, project_name, meeting_date, save = false, use_model } = opts(req.body);

  if (!transcript && !segments) {
    return fail(res, '必须提供 transcript 或 segments', 400, 400);
  }

  const ctx = {
    meetingTitle: meeting_title || '',
    projectName: project_name || '',
    meetingDate: meeting_date || new Date().toISOString().slice(0, 10),
    segments: segments || [{ content: transcript, speaker: '' }],
  };

  const start = Date.now();
  try {
    const result = await extraction.extractActionItems(ctx, { useModel: use_model || config.openai.model });
    const latency = (Date.now() - start) / 1000;
    monitoring.recordExtraction(result._meta?.model || config.openai.model, true, latency);

    if (save) {
      const { meetingId } = await meetingSvc.importTranscript({
        title: meeting_title || `API导入_${Date.now()}`,
        projectName: project_name || null,
        meetingDate: meeting_date || new Date().toISOString().slice(0, 10),
        rawContent: transcript || segments?.map(s => `${s.speaker ? `[${s.speaker}]` : ''}${s.content}`).join('\n') || '',
        sourceFormat: segments ? 'speaker-tagged' : 'plain',
        source: 'inference-api',
      });
      await queue.addJob(queue.QUEUE_NAMES.ACTION_EXTRACT, { meetingId }, { delay: 100 });
      result.meeting_id = meetingId;
    }

    ok(res, {
      action_items: result.action_items,
      topics: result.topics,
      speakers: result.speakers,
      warnings: result.warnings,
      meta: {
        model: result._meta?.model,
        tokens: result._meta?.tokens,
        latency_seconds: latency,
      },
    });
  } catch (err) {
    monitoring.recordExtraction(use_model || config.openai.model, false, (Date.now() - start) / 1000);
    fail(res, `抽取失败: ${err.message}`, 500, 500);
  }
}));

router.post('/validate/sample', asyncHandler(async (req, res) => {
  const { sample, prediction, expected } = req.body;
  if (!sample || !Array.isArray(sample.segments)) {
    return fail(res, 'sample.segments 必填', 400, 400);
  }
  const modelSvc = require('../services/modelService');
  const pred = prediction || {
    action_items: (await extraction.extractActionItems({
      meetingTitle: sample.meeting_title,
      projectName: sample.project_name,
      meetingDate: sample.meeting_date,
      segments: sample.segments,
    }, { useModel: req.body.use_model })).action_items,
  };
  const gt = expected ? [{ sample_id: 'inline', action_items: expected }] :
    [{ sample_id: 'inline', action_items: sample.expected_action_items || [] }];
  const metrics = modelSvc.computeMetrics([{ sample_id: 'inline', action_items: pred.action_items }], gt);
  ok(res, { metrics, prediction: pred.action_items });
}));

function opts(body) { return body; }

module.exports = router;
